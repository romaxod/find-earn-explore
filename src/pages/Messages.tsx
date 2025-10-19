import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const Messages = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when conversation changes
    setMessages([]);
    setLoadingMessages(true);
    checkAuth();
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && user) {
      console.log('Setting up realtime subscription for conversation:', conversationId);
      
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            console.log('✅ Real-time message received:', payload);
            const newMessage = payload.new as any;
            
            // Fetch the complete message with sender info
            const { data } = await supabase
              .from('messages')
              .select('*, sender:sender_id(id, name, email)')
              .eq('id', newMessage.id)
              .single();
            
            if (data) {
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
              });
              
              // Update last_read_at since user is viewing this conversation
              await supabase.rpc('update_conversation_read_status', {
                conv_id: conversationId,
                user_id: user.id
              });
            }
          }
        )
        .subscribe((status, err) => {
          console.log('Realtime subscription status:', status, err);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to conversation:', conversationId);
          }
          if (err) {
            console.error('❌ Subscription error:', err);
          }
        });

      return () => {
        console.log('Cleaning up subscription for:', conversationId);
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setUser(session.user);
    await fetchConversation(session.user.id);
    await fetchMessages();
  };

  const fetchConversation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user:user_id(id, name, email)
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', userId);
      
      if (error) throw error;
      
      setParticipants(data?.map((p: any) => p.user) || []);
      
      // Mark conversation as read
      await supabase.rpc('update_conversation_read_status', {
        conv_id: conversationId,
        user_id: userId
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
      navigate('/profile');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, name, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      console.log('Sending message to conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        })
        .select(`
          *,
          sender:sender_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      
      console.log('✅ Message sent successfully:', data);
      
      // Immediately add the message to the local state for instant display
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-20">
        <div className="container max-w-4xl mx-auto flex flex-col h-full px-4">
          {/* Header */}
          <div className="bg-card border-b py-4 px-4 flex items-center gap-3 -mx-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {participants[0]?.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{participants.map(p => p.name).join(", ")}</p>
              <p className="text-sm text-muted-foreground truncate">
                Active now
              </p>
            </div>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-6">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {participants[0]?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-medium">{participants.map(p => p.name).join(", ")}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.sender_id === user?.id;
                    const showTime = index === 0 || 
                      new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;
                    
                    return (
                      <div key={message.id}>
                        {showTime && (
                          <div className="text-xs text-center text-muted-foreground my-4">
                            {new Date(message.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        <div
                          className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-[15px] leading-relaxed break-words">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Input */}
          <div className="bg-card border-t py-4 px-4 -mx-4">
            <div className="flex gap-2 items-end">
              <Input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1 rounded-full bg-muted border-0 px-4 py-2 min-h-[44px] resize-none"
              />
              <Button 
                onClick={handleSendMessage}
                size="icon"
                className="rounded-full h-11 w-11 shrink-0"
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;