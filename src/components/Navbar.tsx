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

  useEffect(() => {
    let messageChannel: any;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);

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
              
              // Only show notification if message is NOT from current user
              if (newMessage.sender_id !== session.user.id) {
                // Fetch sender info
                const { data: senderData } = await supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', newMessage.sender_id)
                  .single();
                
                const senderName = senderData?.name || 'Someone';
                
                toast({
                  title: `New message from ${senderName}`,
                  description: newMessage.content.substring(0, 100) + (newMessage.content.length > 100 ? '...' : ''),
                  duration: 4000,
                });
              }
            }
          )
          .subscribe();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
      } else {
        setCredits(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [toast]);

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
                    className="gap-2"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
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
