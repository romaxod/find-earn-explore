import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Heart, Smile, Frown, Zap, Brain, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickMoods = [
  { label: "Stressed", icon: Brain, color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  { label: "Happy", icon: Smile, color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  { label: "Sad", icon: Frown, color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  { label: "Bored", icon: Zap, color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  { label: "Anxious", icon: Heart, color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
];

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  wellness_benefit: string;
}

export const MoodAssistant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mood-event-suggestions', {
        body: { mood: moodToUse }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data.suggestions || []);
      
      toast({
        title: "✨ AI Recommendations Ready!",
        description: `Found ${data.suggestions?.length || 0} events to improve your mood`,
      });
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get suggestions",
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
            Tell me how you're feeling, and I'll suggest events to improve your wellness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe your mood... (e.g., stressed, tired, excited)"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGetSuggestions()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleGetSuggestions()}
              disabled={loading || !mood.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Suggestions
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Quick moods:</span>
            {quickMoods.map(({ label, icon: Icon, color }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickMood(label)}
                disabled={loading}
                className={`gap-2 ${color}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xl font-semibold">
            Personalized Recommendations for You
          </h3>
          <div className="grid gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => navigate(`/event/${suggestion.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <Badge variant="secondary" className="w-fit">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Recommended
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Why this helps:</p>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Wellness benefit:</p>
                        <p className="text-sm text-muted-foreground">{suggestion.wellness_benefit}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};