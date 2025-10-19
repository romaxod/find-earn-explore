import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, ArrowLeft, Navigation, Users, Check, UserPlus, MapPinCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TbilisiMap from "@/components/TbilisiMap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteFriendsDialog } from "@/components/InviteFriendsDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isGoing, setIsGoing] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isNearEvent, setIsNearEvent] = useState(false);

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  useEffect(() => {
    checkAuth();
    fetchEvent();
    fetchRsvps();
  }, [id]);

  useEffect(() => {
    if (user && rsvps.length > 0) {
      setIsGoing(rsvps.some(rsvp => rsvp.user_id === user.id));
    }
  }, [user, rsvps]);

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

  const fetchRsvps = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          profiles (name)
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setRsvps(data || []);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleRsvp = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to RSVP to events",
      });
      navigate('/auth');
      return;
    }

    try {
      if (isGoing) {
        // Remove RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        toast({
          title: "RSVP removed",
          description: "You are no longer going to this event",
        });
      } else {
        // Add RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: id,
            user_id: user.id,
          });
        
        if (error) throw error;
        
        toast({
          title: "RSVP confirmed! 🎉",
          description: "You're going to this event",
        });
      }
      
      fetchRsvps();
    } catch (error: any) {
      console.error('Error managing RSVP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP",
        variant: "destructive",
      });
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

    if (!isNearEvent) {
      toast({
        title: "Location verification required",
        description: "You must be at the event location to check in",
        variant: "destructive",
      });
      return;
    }

    setAttending(true);
    try {
      const { data, error } = await supabase.functions.invoke('attend-event', {
        body: { 
          eventId: id,
          userLat: userLocation?.lat,
          userLng: userLocation?.lng
        }
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

  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setCheckingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        if (event) {
          const distance = calculateDistance(
            userLat,
            userLng,
            event.location_lat,
            event.location_lng
          );

          console.log(`Distance to event: ${Math.round(distance)} meters`);

          // Allow check-in if within 100 meters of event
          const maxDistance = 100;
          setIsNearEvent(distance <= maxDistance);

          if (distance <= maxDistance) {
            toast({
              title: "Location verified! ✅",
              description: `You're ${Math.round(distance)}m from the event. You can now check in!`,
            });
          } else {
            toast({
              title: "Too far from event",
              description: `You're ${Math.round(distance)}m away. Get within 100m to check in.`,
              variant: "destructive",
            });
          }
        }
        setCheckingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Unable to get your location";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        setLocationError(errorMessage);
        setCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
                <span className="font-medium">{rsvps.length} going</span>
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
                      {new Date(event.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
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

              {rsvps.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Who's Going ({rsvps.length})</h2>
                  <div className="grid gap-3">
                    {rsvps.map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="text-sm">
                              {rsvp.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{rsvp.profiles?.name || 'User'}</p>
                            <p className="text-sm text-muted-foreground">{rsvp.profiles?.email || ''}</p>
                          </div>
                        </div>
                        {user && rsvp.user_id !== user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('friend_requests')
                                  .insert({
                                    sender_id: user.id,
                                    receiver_id: rsvp.user_id,
                                    status: 'pending'
                                  });
                                
                                if (error) {
                                  if (error.code === '23505') {
                                    toast({
                                      title: "Already sent",
                                      description: "Friend request already exists",
                                      variant: "destructive",
                                    });
                                  } else {
                                    throw error;
                                  }
                                } else {
                                  toast({
                                    title: "Friend request sent! 🎉",
                                    description: `Sent to ${rsvp.profiles?.name}`,
                                  });
                                }
                              } catch (error: any) {
                                console.error('Error:', error);
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to send request",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border">
                  <TbilisiMap 
                    highlightEvent={{ 
                      lat: event.location_lat, 
                      lng: event.location_lng,
                      id: event.id
                    }}
                    showDirections={showDirections}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
                <Button 
                  className="gap-2" 
                  size="lg"
                  onClick={() => setShowDirections(!showDirections)}
                >
                  <Navigation className="w-4 h-4" />
                  {showDirections ? "Hide Route" : "Get Directions"}
                </Button>
                <Button 
                  variant={isGoing ? "outline" : "default"}
                  className="gap-2" 
                  size="lg"
                  onClick={handleRsvp}
                >
                  {isGoing && <Check className="w-4 h-4" />}
                  {isGoing ? "Going" : "I'm Going"}
                </Button>
                <InviteFriendsDialog eventId={event.id} eventTitle={event.title} />
                <Button 
                  variant="default"
                  className="gap-2"
                  size="lg"
                  onClick={isNearEvent ? handleAttendEvent : verifyLocation}
                  disabled={attending || checkingLocation}
                >
                  {checkingLocation ? (
                    "Verifying location..."
                  ) : isNearEvent ? (
                    <>
                      <MapPinCheck className="w-4 h-4" />
                      Check In & Earn
                    </>
                  ) : attending ? (
                    "Checking in..."
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Check In & Earn
                    </>
                  )}
                </Button>
              </div>

              {locationError && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              )}

              {userLocation && !isNearEvent && (
                <Alert className="animate-fade-in">
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    You're currently {event && Math.round(calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      event.location_lat,
                      event.location_lng
                    ))}m from the event. Get within 100m to check in.
                  </AlertDescription>
                </Alert>
              )}

              {isNearEvent && (
                <Alert className="bg-primary/10 border-primary animate-fade-in">
                  <MapPinCheck className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">
                    Location verified! You can now check in and earn credits.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
