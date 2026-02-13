import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing?.is_active) {
      return new Response(
        JSON.stringify({ message: "You're already subscribed!" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Reactivate if previously unsubscribed, or insert new
    if (existing && !existing.is_active) {
      await supabase
        .from("newsletter_subscribers")
        .update({ is_active: true, subscribed_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("newsletter_subscribers").insert({
        email: email.toLowerCase().trim(),
        is_active: true,
      });
    }

    // Send confirmation email using Gmail SMTP (via Nodemailer)
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (SMTP_USER && SMTP_PASS) {
      // Create a transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      // Send the email
      await transporter.sendMail({
        from: `"CultureSwap" <${SMTP_USER}>`,
        to: email,
        subject: "Welcome to CultureSwap Newsletter! 🌍",
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdf6ee; padding: 40px 30px; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a2942; font-size: 28px; margin: 0;">
                  <span style="color: #c75a2a;">Culture</span>Swap
                </h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h2 style="color: #1a2942; font-size: 22px; margin-top: 0;">Welcome aboard! 🎉</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  Thank you for subscribing to the CultureSwap newsletter! You'll receive weekly tips on:
                </p>
                <ul style="color: #555; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                  <li>🌐 Cultural exchange insights</li>
                  <li>📚 Skill sharing best practices</li>
                  <li>🤝 Community highlights & success stories</li>
                  <li>🎯 New features and platform updates</li>
                </ul>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  Stay curious, keep swapping! 🚀
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #888; font-size: 13px;">
                <p>© ${new Date().getFullYear()} CultureSwap. All rights reserved.</p>
                <p>You received this because you subscribed at cultureswap.com</p>
              </div>
            </div>
          `,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Successfully subscribed! Check your email for confirmation.",
        success: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
