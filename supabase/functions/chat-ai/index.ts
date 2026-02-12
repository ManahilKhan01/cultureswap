import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { message, context } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are Swapy, the friendly AI assistant for CultureSwap - a platform for cultural and skill exchange.

CRITICAL RULES:
1. You ONLY answer questions about CultureSwap, cultural exchange, skill sharing, language learning, and related topics.
2. If someone asks about ANYTHING unrelated (politics, coding help, recipes, general knowledge, etc.), politely decline and redirect them to CultureSwap topics.
3. Example decline: "That's an interesting question! But I'm Swapy, and I specialize in helping with CultureSwap. 😊 Is there anything about swaps, profiles, or finding partners I can help with?"

ABOUT CULTURESWAP:
- CultureSwap connects people to exchange skills and cultural knowledge
- Users can teach what they know (e.g., Spanish, Guitar, Cooking) and learn what they want
- It's 100% FREE - no money involved, just skill-for-skill exchange
- Key features: Discover page, Swap Offers, Messaging, User Profiles, Reviews

YOUR PERSONALITY:
- Friendly and warm 😊
- Use emojis occasionally (but not excessively)
- Be concise and helpful
- Encourage users to explore CultureSwap features`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: context
              ? `Previous conversation:\n${context}\n\nCurrent message: ${message}`
              : message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI error:", error);
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "I couldn't generate a response. Please try again!";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        reply: "I'm having trouble connecting. Please try again! 😅",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
