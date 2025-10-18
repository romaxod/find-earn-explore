import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile with hobbies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('hobbies')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Get user's past attendance to find preferred categories
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('event_id')
      .eq('user_id', user.id);

    let preferredCategories: string[] = [];
    
    if (attendance && attendance.length > 0) {
      const eventIds = attendance.map(a => a.event_id);
      const { data: pastEvents } = await supabase
        .from('events')
        .select('category')
        .in('id', eventIds);

      if (pastEvents) {
        preferredCategories = [...new Set(pastEvents.map(e => e.category))];
      }
    }

    // Get all events
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('time', new Date().toISOString())
      .order('time', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Score and sort events based on personalization
    const scoredEvents = (allEvents || []).map(event => {
      let score = 0;

      // Boost score if event category matches past attendance
      if (preferredCategories.includes(event.category)) {
        score += 10;
      }

      // Boost score if event category matches hobbies
      if (profile?.hobbies) {
        const hobbiesLower = profile.hobbies.map((h: string) => h.toLowerCase());
        if (hobbiesLower.some((hobby: string) => event.category.toLowerCase().includes(hobby) || event.title.toLowerCase().includes(hobby))) {
          score += 5;
        }
      }

      // Add some randomness for variety
      score += Math.random() * 2;

      return { ...event, score };
    });

    // Sort by score (highest first)
    scoredEvents.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({ events: scoredEvents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});