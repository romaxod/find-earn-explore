import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, ArrowLeft, Navigation, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchEvent();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const fetchEvent = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendEvent = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to attend events and earn credits",
      });
      navigate('/auth');
      return;
    }

    setAttending(true);
    try {
      const { data, error } = await supabase.functions.invoke('attend-event', {
        body: { eventId: id }
      });
      
      if (error) throw error;
      
      if (data.alreadyAttended) {
        toast({
          title: "Already attended",
          description: "You've already checked in to this event",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success! 🎉",
        description: `You earned ${data.earnedCredits} credits! Total: ${data.newTotalCredits}`,
      });
      
      // Refresh event data to update attendee count
      fetchEvent();
    } catch (error: any) {
      console.error('Error attending event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in to event",
        variant: "destructive",
      });
    } finally {
      setAttending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <p className="text-xl text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-xl text-muted-foreground mb-4">Event not found</p>
          <Link to="/explore">
            <Button>Back to Explore</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link to="/explore">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Button>
          </Link>

          <div className="space-y-6">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="text-sm">{event.category}</Badge>
              </div>
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">{event.attendees_count || 0} attending</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{event.price}</div>
                  <div className="text-sm text-muted-foreground">credits to earn</div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{event.location_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Lat: {event.location_lat}, Lng: {event.location_lng}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{new Date(event.time).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.time).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              {event.description && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 gap-2" 
                  size="lg"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_lng}`, '_blank', 'noopener,noreferrer')}
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </Button>
                <Button 
                  variant="hero" 
                  className="flex-1" 
                  size="lg"
                  onClick={handleAttendEvent}
                  disabled={attending}
                >
                  {attending ? "Checking in..." : "Check In & Earn Credits"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
