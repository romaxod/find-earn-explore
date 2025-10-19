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
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    let notificationChannel: any;
    let clearingConversations = false;

    // Listen for custom event when user clicks conversations button - clear immediately
    const handleConversationsClicked = () => {
      setHasNotifications(false);
      clearingConversations = true;
      // Reset flag after a delay to allow database updates to propagate
      setTimeout(() => {
        clearingConversations = false;
      }, 2000);
    };

    window.addEventListener('conversationsClicked', handleConversationsClicked);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
        checkNotifications(session.user.id);

        // Set up realtime subscription for invitation changes
        notificationChannel = supabase
          .channel('notification-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_invitations',
              filter: `receiver_id=eq.${session.user.id}`
            },
            () => {
              checkNotifications(session.user.id);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            () => {
              checkNotifications(session.user.id);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversation_participants'
            },
            () => {
              // Only re-check if not currently clearing conversations
              if (!clearingConversations) {
                checkNotifications(session.user.id);
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
        checkNotifications(session.user.id);
      } else {
        setCredits(0);
        setHasNotifications(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
      window.removeEventListener('conversationsClicked', handleConversationsClicked);
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

  const checkNotifications = async (userId: string) => {
    // Check for pending event invitations
    const { data: invitations } = await supabase
      .from('event_invitations')
      .select('id')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    // Check for unread messages in user's conversations
    const { data: userConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    let hasUnreadMessages = false;
    if (userConversations && userConversations.length > 0) {
      for (const conv of userConversations) {
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', userId)
          .gt('created_at', conv.last_read_at || new Date(0).toISOString())
          .limit(1);
        
        if (unreadMessages && unreadMessages.length > 0) {
          hasUnreadMessages = true;
          break;
        }
      }
    }

    setHasNotifications((invitations && invitations.length > 0) || hasUnreadMessages);
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
                    {hasNotifications && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
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
