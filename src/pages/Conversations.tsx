import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const Conversations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to conversation changes
    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          fetchConversations(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setUser(session.user);
    await fetchConversations(session.user.id);
  };

  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get all conversations where user is a participant
      const { data: participantData, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
      
      if (partError) throw partError;
      
      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation details with other participants
      const { data: convData, error: convError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user:user_id(id, name, email)
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', userId);
      
      if (convError) throw convError;

      // Get last message for each conversation
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });
      
      if (msgError) throw msgError;

      // Group by user (not by conversation)
      const usersMap = new Map();
      
      convData?.forEach((cp: any) => {
        const userId = cp.user.id;
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            user: cp.user,
            conversations: [],
            lastMessage: null,
            lastMessageTime: null,
            mostRecentConversationId: cp.conversation_id
          });
        }
        usersMap.get(userId).conversations.push(cp.conversation_id);
      });

      // Add last messages and find most recent conversation per user
      messagesData?.forEach((msg: any) => {
        // Find which user this conversation belongs to
        for (const [userId, userData] of usersMap.entries()) {
          if (userData.conversations.includes(msg.conversation_id)) {
            if (!userData.lastMessageTime || new Date(msg.created_at) > new Date(userData.lastMessageTime)) {
              userData.lastMessage = msg.content;
              userData.lastMessageTime = msg.created_at;
              userData.mostRecentConversationId = msg.conversation_id;
            }
          }
        }
      });

      const conversationsList = Array.from(usersMap.values())
        .map(userData => ({
          id: userData.mostRecentConversationId,
          participants: [userData.user],
          lastMessage: userData.lastMessage,
          lastMessageTime: userData.lastMessageTime
        }))
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
      
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <p className="text-xl text-muted-foreground text-center">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Conversations</h1>
              <p className="text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Start a conversation with your friends from your profile
                </p>
              </div>
              <Button onClick={() => navigate('/profile')}>
                Go to Profile
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className="w-full p-4 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-4 text-left"
                  >
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {conv.participants[0]?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold truncate">
                          {conv.participants.map((p: any) => p.name).join(", ")}
                        </p>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default Conversations;
