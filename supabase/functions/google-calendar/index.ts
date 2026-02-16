declare namespace Deno {
    export const env: {
        get(key: string): string | undefined;
    };
}

// @ts-ignore: Deno library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Supabase library
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const segments = url.pathname.split('/').filter(Boolean);
        const path = segments[segments.length - 1]; // e.g., "auth", "google-callback", "create-meeting"

        const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
        const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
        const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Helper to get authenticated user from request header
        const getAuthUser = async (request: Request) => {
            const authHeader = request.headers.get("Authorization");
            if (!authHeader) throw new Error("Missing Authorization header");

            const supabaseClient = createClient(
                SUPABASE_URL!,
                SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );

            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error || !user) throw new Error("Invalid or expired token");
            return user;
        };

        // Initialize Supabase Admin Client for database operations
        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // --- PUBLIC ROUTES (No Auth Required) ---

        // 1. AUTH: Generate Google Auth URL
        if (path === "auth") {
            if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
                throw new Error("Missing Google Credentials in Supabase secrets.");
            }

            // We need the user ID to associate the token later.
            // Since this is the start of the flow, we expect the client to send the user ID in the query param or body if not authenticated yet?
            // Actually, usually this route IS protected because we need to know WHO is connecting.
            // But if the client calls it, they should have a session.
            // Let's make this PROTECTED to get the user ID securely.
            const user = await getAuthUser(req);

            const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
            authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events");
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");
            authUrl.searchParams.set("state", user.id); // Pass user ID in state

            return new Response(JSON.stringify({ url: authUrl.toString() }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. CALLBACK: Handle Google OAuth Callback (PUBLIC)
        // This is called by Google, so it won't have our app's Authorization header.
        if (path === "google-callback" || url.searchParams.has("code")) {
            const code = url.searchParams.get("code");
            const userId = url.searchParams.get("state");
            const error = url.searchParams.get("error");

            if (error) {
                return new Response(`Google OAuth Error: ${error}`, {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "text/html" }
                });
            }

            if (!code || !userId) {
                return new Response("Missing code or state parameter", {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "text/html" }
                });
            }

            // Exchange code for tokens
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID!,
                    client_secret: GOOGLE_CLIENT_SECRET!,
                    redirect_uri: GOOGLE_REDIRECT_URI!,
                    grant_type: "authorization_code",
                }),
            });

            const tokens = await tokenResponse.json();
            if (tokens.error) {
                return new Response(`Token Exchange Error: ${JSON.stringify(tokens)}`, {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "text/html" }
                });
            }

            // Store tokens in database using Admin client
            const { error: dbError } = await supabaseAdmin
                .from("google_tokens")
                .upsert({
                    user_id: userId,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token, // Only returned on first consent or if prompt=consent
                    expiry_date: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                });

            if (dbError) {
                return new Response(`Database Error: ${dbError.message}`, {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "text/html" }
                });
            }

            // Redirect back to frontend
            const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
            return Response.redirect(`${frontendUrl}/profile?google=connected`, 302);
        }

        // --- PROTECTED ROUTES (Auth Required) ---

        // 3. CREATE MEETING: Generate Google Meet Link
        if (path === "create-meeting") {
            const user = await getAuthUser(req);

            // Check if user has connected Google Calendar
            const { data: tokenData, error: tokenError } = await supabaseAdmin
                .from("google_tokens")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (tokenError || !tokenData) {
                return new Response(JSON.stringify({ error: "Google account not connected" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            let accessToken = tokenData.access_token;

            // Refresh token if expired
            if (new Date(tokenData.expiry_date) <= new Date()) {
                console.log("Token expired, refreshing...");
                if (!tokenData.refresh_token) {
                    return new Response(JSON.stringify({ error: "Token expired and no refresh token available. Please reconnect Google Calendar." }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: GOOGLE_CLIENT_ID!,
                        client_secret: GOOGLE_CLIENT_SECRET!,
                        refresh_token: tokenData.refresh_token,
                        grant_type: "refresh_token",
                    }),
                });

                const newTokens = await refreshResponse.json();

                if (newTokens.error) {
                    console.error("Error refreshing token:", newTokens);
                    return new Response(JSON.stringify({ error: "Failed to refresh Google token. Please reconnect." }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (newTokens.access_token) {
                    accessToken = newTokens.access_token;
                    await supabaseAdmin.from("google_tokens").update({
                        access_token: accessToken,
                        expiry_date: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
                    }).eq("user_id", user.id);
                }
            }

            let body;
            try {
                body = await req.json();
            } catch (e) {
                return new Response(JSON.stringify({ error: "Invalid request body" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const { summary, description, start_time, duration_minutes } = body;

            if (!start_time) {
                return new Response(JSON.stringify({ error: "Missing required field: start_time" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const endTime = new Date(new Date(start_time).getTime() + (duration_minutes || 60) * 60000).toISOString();

            console.log("Creating Google Meet event...", { summary, start_time, endTime });

            const eventResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    summary: summary || "CultureSwap Session",
                    description: description || "Meeting scheduled via CultureSwap",
                    start: { dateTime: start_time, timeZone: "Asia/Karachi" },
                    end: { dateTime: endTime, timeZone: "Asia/Karachi" },
                    conferenceData: {
                        createRequest: {
                            requestId: `cs-${Date.now()}`,
                            conferenceSolutionKey: { type: "hangoutsMeet" },
                        },
                    },
                }),
            });

            const eventData = await eventResponse.json();

            if (!eventResponse.ok) {
                console.error("Google Calendar API Error:", eventData);
                return new Response(JSON.stringify({
                    error: `Google Calendar API Error: ${eventData.error?.message || 'Unknown error'}`,
                    details: eventData
                }), {
                    status: eventResponse.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            if (!eventData.hangoutLink) {
                console.error("No hangoutLink in response:", eventData);
                return new Response(JSON.stringify({
                    error: "Failed to generate Google Meet link. Please check your Google Calendar settings.",
                    details: eventData
                }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify({
                meetLink: eventData.hangoutLink,
                eventId: eventData.id
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Default response for unknown paths
        return new Response(JSON.stringify({ error: "Function not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Edge Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message === "Invalid or expired token" || error.message === "Missing Authorization header" ? 401 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
