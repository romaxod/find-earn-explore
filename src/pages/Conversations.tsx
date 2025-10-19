import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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
    if (user) {
      const channel = supabase
        .channel('conversations-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setUser(session.user);
    await fetchConversations();
  };

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's conversations
      const { data: participantData, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      
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
          user:user_id(id, name, email),
          conversations:conversation_id(updated_at)
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);
      
      if (convError) throw convError;

      // Get last message for each conversation
      const conversationsMap = new Map();
      
      for (const cp of (convData || [])) {
        if (!conversationsMap.has(cp.conversation_id)) {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', cp.conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          conversationsMap.set(cp.conversation_id, {
            id: cp.conversation_id,
            participants: [cp.user],
            lastMessage: lastMsg,
            updated_at: cp.conversations?.updated_at
          });
        } else {
          conversationsMap.get(cp.conversation_id).participants.push(cp.user);
        }
      }
      
      const conversationsList = Array.from(conversationsMap.values())
        .sort((a, b) => {
          const timeA = a.lastMessage?.created_at || a.updated_at;
          const timeB = b.lastMessage?.created_at || b.updated_at;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
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
      
      <main className="pt-20 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/profile')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-bold">Messages</h1>
            </div>
            <Button onClick={() => navigate('/profile')}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            {conversations.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start chatting with your friends from your profile
                </p>
                <Button onClick={() => navigate('/profile')}>
                  Go to Profile
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/messages/${conv.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {conv.participants[0]?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                          <p className="font-semibold truncate">
                            {conv.participants.map((p: any) => p.name).join(", ")}
                          </p>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || "Start the conversation"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default Conversations;