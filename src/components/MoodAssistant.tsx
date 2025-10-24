import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Heart, Smile, Frown, Zap, Brain, Loader2, Meh, Send, Bot, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const quickMoods = [
  { label: "Stressed", icon: Brain, color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  { label: "Happy", icon: Smile, color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  { label: "Sad", icon: Frown, color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  { label: "Bored", icon: Meh, color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  { label: "Anxious", icon: Heart, color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
];

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  wellness_benefit: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Suggestion[];
}

export const MoodAssistant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Mood Assistant. 🌟 Tell me how you're feeling today, and I'll recommend events in Tbilisi that can help improve your mood and wellness."
    }
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to use the AI Mood Assistant",
        variant: "destructive",
      });
    }
  };

  const handleGetSuggestions = async (selectedMood?: string) => {
    const moodToUse = selectedMood || mood;
    
    if (!moodToUse.trim()) {
      toast({
        title: "Please enter your mood",
        description: "Let us know how you're feeling",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the AI Mood Assistant",
        variant: "destructive",
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: moodToUse
    };
    setMessages(prev => [...prev, userMessage]);
    setMood("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mood-event-suggestions', {
        body: { mood: moodToUse }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const suggestions = data.suggestions || [];
      const message = data.message || '';
      const type = data.type || 'conversation';
      
      // Create AI response message
      const assistantMessage: Message = {
        role: 'assistant',
        content: message || (suggestions.length > 0 
          ? `Based on your mood, I found ${suggestions.length} perfect events for you! Click on any event to learn more.`
          : 'I understand. How else can I help you today?'),
        suggestions: type === 'events' ? suggestions : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (type === 'events' && suggestions.length > 0) {
        toast({
          title: "✨ Recommendations Ready!",
          description: `Found ${suggestions.length} events to boost your mood`,
        });
      }
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Failed to get suggestions'}. Please try again or contact support if the issue persists.`
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMood = (moodLabel: string) => {
    setMood(moodLabel);
    handleGetSuggestions(moodLabel);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Mood Assistant
          </CardTitle>
          <CardDescription>
            Have a conversation with AI to get personalized event recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversation History */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Event Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="w-full space-y-3 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Card 
                            key={idx} 
                            className="hover:border-primary/50 transition-all cursor-pointer w-full"
                            onClick={() => navigate(`/event/${suggestion.id}`)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                  <CardTitle className="text-base">{suggestion.title}</CardTitle>
                                  <Badge variant="secondary" className="w-fit">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI Pick
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium mb-1">Why this helps:</p>
                                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium mb-1">Wellness benefit:</p>
                                  <p className="text-xs text-muted-foreground">{suggestion.wellness_benefit}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="rounded-lg p-4 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm">Analyzing your mood and finding perfect events...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Mood Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground w-full mb-1">Quick moods:</span>
            {quickMoods.map(({ label, icon: Icon, color }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickMood(label)}
                disabled={loading || !isAuthenticated}
                className={`gap-2 ${color}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              placeholder={isAuthenticated ? "Tell me how you're feeling today..." : "Please sign in to use AI Mood Assistant"}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGetSuggestions();
                }
              }}
              disabled={loading || !isAuthenticated}
              className="flex-1 min-h-[80px] resize-none"
            />
            <Button 
              onClick={() => handleGetSuggestions()}
              disabled={loading || !mood.trim() || !isAuthenticated}
              className="gap-2 self-end"
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};