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

    const { eventId } = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already attended
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single();

    if (existingAttendance) {
      return new Response(
        JSON.stringify({ error: 'Already attended this event', alreadyAttended: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event to determine credits
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('price')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate credits earned (50 base credits)
    const earnedCredits = 50;

    // Record attendance
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        event_id: eventId,
        earned_credits: earnedCredits
      });

    if (attendanceError) {
      throw attendanceError;
    }

    // Update user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const newCredits = (profile?.credits || 0) + earnedCredits;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Increment attendees count
    const { error: eventUpdateError } = await supabase.rpc('increment_attendees', {
      event_id: eventId
    });

    // If RPC doesn't exist, directly update
    if (eventUpdateError) {
      const { data: currentEvent } = await supabase
        .from('events')
        .select('attendees_count')
        .eq('id', eventId)
        .single();

      await supabase
        .from('events')
        .update({ attendees_count: (currentEvent?.attendees_count || 0) + 1 })
        .eq('id', eventId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        earnedCredits, 
        newTotalCredits: newCredits 
      }),
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