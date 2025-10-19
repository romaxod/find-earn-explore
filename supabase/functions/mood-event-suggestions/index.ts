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
            content: `You are a wellness and mood improvement advisor. Based on the user's mood, suggest 3-5 events that would best help improve their emotional state and overall wellness. Consider:
            - If they're stressed: suggest calming activities like yoga, nature walks, or cultural events
            - If they're sad: suggest uplifting activities like music, comedy, or social events
            - If they're bored: suggest exciting activities like sports, nightlife, or adventure
            - If they're anxious: suggest grounding activities like meditation, art, or quiet cultural experiences
            - If they're lonely: suggest social events where they can meet people
            
            For each recommendation, explain WHY this event would help their current mood.
            Format your response as a JSON array with this structure:
            [
              {
                "title": "event title",
                "reason": "why this helps their mood",
                "wellness_benefit": "specific wellness benefit"
              }
            ]`
          },
          {
            role: "user",
            content: `My current mood: ${mood}\n\nAvailable events:\n${JSON.stringify(eventsList, null, 2)}\n\nPlease suggest events that would help improve my mood and wellness.`
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
    let suggestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiSuggestions = JSON.parse(jsonMatch[0]);
        // Match AI suggestions with actual events to get IDs
        suggestions = aiSuggestions.map((suggestion: any) => {
          const matchedEvent = events?.find(e => 
            e.title.toLowerCase() === suggestion.title.toLowerCase()
          );
          return {
            ...suggestion,
            id: matchedEvent?.id || null
          };
        }).filter((s: any) => s.id !== null); // Only include matched events
      } else {
        // If no JSON found, create a structured response from the text
        suggestions = [{
          title: "AI Recommendations",
          reason: aiResponse,
          wellness_benefit: "Follow AI advice for improved wellness",
          id: null
        }];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      suggestions = [{
        title: "AI Recommendations",
        reason: aiResponse,
        wellness_benefit: "Follow AI advice for improved wellness",
        id: null
      }];
    }

    return new Response(
      JSON.stringify({ 
        suggestions,
        mood: mood 
      }),
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