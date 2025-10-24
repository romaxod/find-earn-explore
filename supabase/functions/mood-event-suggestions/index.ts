import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood } = await req.json();
    
    if (!mood) {
      return new Response(
        JSON.stringify({ error: 'Mood is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Prepare event data for AI
    const eventsList = events?.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      description: e.description,
      time: e.time,
      location: e.location_name,
      price: e.price
    })) || [];

    console.log('Calling Lovable AI with mood:', mood);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly and empathetic mood assistant helping people in Tbilisi, Georgia. 

YOUR ROLE:
- Have natural, human-like conversations
- Be warm, understanding, and supportive
- Ask follow-up questions to understand their mood better
- ONLY suggest events when the user explicitly describes a mood/feeling or asks for recommendations

CONVERSATION GUIDELINES:
- If they greet you (hi, hello, how are you), respond warmly and ask how they're feeling
- If they ask general questions, answer naturally without pushing events
- If they share a mood/feeling, empathize and ask if they'd like event suggestions
- ONLY provide event recommendations when they actually want them

WHEN TO SUGGEST EVENTS:
- When they describe how they're feeling (stressed, sad, bored, anxious, happy, etc.)
- When they explicitly ask for recommendations
- When they say yes to your offer of suggestions

EVENT RECOMMENDATION RULES (ONLY when appropriate):
- If stressed: calming activities like yoga, nature walks, cultural events
- If sad: uplifting activities like music, comedy, social events
- If bored: exciting activities like sports, nightlife, adventure
- If anxious: grounding activities like meditation, art, quiet cultural experiences
- If lonely: social events where they can meet people
- If happy: energetic activities to maintain the positive mood

RESPONSE FORMAT:
If suggesting events, respond with JSON:
{
  "type": "events",
  "message": "your conversational message",
  "suggestions": [
    {
      "title": "event title",
      "reason": "why this helps their mood",
      "wellness_benefit": "specific wellness benefit"
    }
  ]
}

If just conversing, respond with JSON:
{
  "type": "conversation",
  "message": "your friendly response"
}`
          },
          {
            role: "user",
            content: `User says: "${mood}"\n\nAvailable events (only use if suggesting events):\n${JSON.stringify(eventsList, null, 2)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the AI response
    let result;
    try {
      // Try to extract JSON object from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        if (parsedResponse.type === 'events' && parsedResponse.suggestions) {
          // Match AI suggestions with actual events to get IDs
          const suggestions = parsedResponse.suggestions.map((suggestion: any) => {
            const matchedEvent = events?.find(e => 
              e.title.toLowerCase() === suggestion.title.toLowerCase()
            );
            return {
              ...suggestion,
              id: matchedEvent?.id || null
            };
          }).filter((s: any) => s.id !== null); // Only include matched events
          
          result = {
            type: 'events',
            message: parsedResponse.message,
            suggestions,
            mood: mood
          };
        } else {
          // Just a conversation, no events
          result = {
            type: 'conversation',
            message: parsedResponse.message || aiResponse,
            suggestions: [],
            mood: mood
          };
        }
      } else {
        // If no JSON found, treat as conversation
        result = {
          type: 'conversation',
          message: aiResponse,
          suggestions: [],
          mood: mood
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      result = {
        type: 'conversation',
        message: aiResponse,
        suggestions: [],
        mood: mood
      };
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in mood-event-suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});