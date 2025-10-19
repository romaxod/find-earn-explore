import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, User, Coins, LogOut, Compass, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  useEffect(() => {
    let messageChannel: any;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);

        console.log('🔔 Setting up message notification listener for user:', session.user.id);

        // Set up realtime subscription for incoming messages
        messageChannel = supabase
          .channel('incoming-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            async (payload) => {
              const newMessage = payload.new as any;
              console.log('📨 New message received:', newMessage);
              console.log('👤 Current user ID:', session.user.id);
              console.log('📤 Message sender ID:', newMessage.sender_id);
              
              // Only show red dot if message is NOT from current user
              if (newMessage.sender_id !== session.user.id) {
                console.log('✅ Showing red dot - message from someone else');
                setShowNotificationDot(true);
                
                // Hide the dot after 4 seconds
                setTimeout(() => {
                  console.log('⏰ Hiding red dot after 4 seconds');
                  setShowNotificationDot(false);
                }, 4000);
              } else {
                console.log('❌ Not showing dot - message is from current user');
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Message channel subscription status:', status);
          });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
      } else {
        setCredits(0);
        setShowNotificationDot(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (messageChannel) {
        console.log('🔌 Unsubscribing from message channel');
        supabase.removeChannel(messageChannel);
      }
    };
  }, []);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (data) {
      setCredits(data.credits || 0);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold group-hover:text-primary transition-smooth">
              Gulaob.ai
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/explore">
              <Button 
                variant={location.pathname === "/explore" ? "default" : "ghost"} 
                className="gap-2"
              >
                <Compass className="w-4 h-4" />
                Explore
              </Button>
            </Link>
            <Link to="/map">
              <Button 
                variant={location.pathname === "/map" ? "default" : "ghost"} 
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Map
              </Button>
            </Link>
            <Link to="/credits">
              <Button 
                variant={location.pathname === "/credits" ? "default" : "ghost"} 
                className="gap-2"
              >
                <Coins className="w-4 h-4" />
                Credits
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link to="/profile">
                  <Button 
                    variant={location.pathname === "/profile" ? "default" : "ghost"} 
                    className="gap-2 relative"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
                    {showNotificationDot && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                  </Button>
                </Link>
                <Button variant="ghost" className="gap-2" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
