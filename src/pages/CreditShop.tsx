import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Dumbbell, Palette, PartyPopper, Calendar, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CreditShop = () => {
  const navigate = useNavigate();
  const [userCredits, setUserCredits] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchCredits();
  }, []);

  const checkAuthAndFetchCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setUserId(session.user.id);
    await fetchCredits(session.user.id);
    setLoading(false);
  };

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const discountPackages = [
    {
      id: 1,
      name: "Nightclub Elite Pass",
      discount: "25% off",
      duration: "1 Month",
      credits: 150,
      category: "Nightclub Events",
      icon: PartyPopper,
      description: "Get 25% discount on all nightclub events for an entire month",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 2,
      name: "Sports Enthusiast",
      discount: "20% off",
      duration: "1 Month",
      credits: 120,
      category: "Sports Events",
      icon: Dumbbell,
      description: "Enjoy 20% off on all sports events and activities",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      id: 3,
      name: "Concert VIP",
      discount: "30% off",
      duration: "2 Weeks",
      credits: 100,
      category: "Concert Events",
      icon: Music,
      description: "Premium 30% discount on concert tickets for 2 weeks",
      gradient: "from-red-500/20 to-orange-500/20"
    },
    {
      id: 4,
      name: "Culture Connoisseur",
      discount: "25% off",
      duration: "3 Months",
      credits: 200,
      category: "Cultural Events",
      icon: Palette,
      description: "Long-term 25% savings on museums, galleries, and cultural experiences",
      gradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      id: 5,
      name: "Nightlife Starter",
      discount: "15% off",
      duration: "2 Weeks",
      credits: 75,
      category: "Nightclub Events",
      icon: PartyPopper,
      description: "Start your nightlife journey with 15% off for 2 weeks",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 6,
      name: "Sports Weekend",
      discount: "10% off",
      duration: "1 Week",
      credits: 50,
      category: "Sports Events",
      icon: Dumbbell,
      description: "Quick weekend boost with 10% off sports events",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      id: 7,
      name: "Music Master",
      discount: "25% off",
      duration: "1 Month",
      credits: 140,
      category: "Concert Events",
      icon: Music,
      description: "Full month access to 25% discounts on all concerts",
      gradient: "from-red-500/20 to-orange-500/20"
    },
    {
      id: 8,
      name: "Event Explorer",
      discount: "20% off",
      duration: "1 Month",
      credits: 130,
      category: "All Events",
      icon: Calendar,
      description: "Universal 20% discount across all event categories",
      gradient: "from-amber-500/20 to-yellow-500/20"
    },
    {
      id: 9,
      name: "Premium All-Access",
      discount: "30% off",
      duration: "3 Months",
      credits: 350,
      category: "All Events",
      icon: Sparkles,
      description: "Ultimate premium package: 30% off everything for 3 months",
      gradient: "from-violet-500/20 to-fuchsia-500/20"
    }
  ];

  const handlePurchase = async (pkg: typeof discountPackages[0]) => {
    if (!userId) return;
    
    if (userCredits >= pkg.credits) {
      try {
        const newCredits = userCredits - pkg.credits;
        const { error } = await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId);
        
        if (error) throw error;
        
        setUserCredits(newCredits);
        toast({
          title: "Discount Package Activated!",
          description: `${pkg.name}: ${pkg.discount} on ${pkg.category} for ${pkg.duration}`,
        });
      } catch (error) {
        console.error('Error updating credits:', error);
        toast({
          title: "Error",
          description: "Failed to purchase package",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Insufficient Credits",
        description: `You need ${pkg.credits} credits but only have ${userCredits}.`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container max-w-7xl mx-auto">
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
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold gradient-hero-text">
                Premium Discount Packages
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Unlock exclusive discounts on your favorite event categories with our premium credit packages
              </p>
            </div>
            
            <Card className="max-w-lg mx-auto gradient-card border-primary/20 shadow-glow">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Available Credits</p>
                    <p className="text-5xl font-bold gradient-hero-text">{userCredits}</p>
                  </div>
                  <Button className="gradient-hero border-0 shadow-glow transition-smooth hover:scale-105">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Purchase More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {discountPackages.map((pkg) => {
              const Icon = pkg.icon;
              const canAfford = userCredits >= pkg.credits;
              return (
                <Card 
                  key={pkg.id} 
                  className={`gradient-card border-primary/20 hover:shadow-glow transition-smooth hover:scale-[1.02] ${!canAfford && 'opacity-60'}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${pkg.gradient} backdrop-blur-sm`}>
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
                        {pkg.credits} credits
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-base text-muted-foreground">
                        {pkg.category}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-muted-foreground">Discount</span>
                        <span className="text-2xl font-bold text-primary">{pkg.discount}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                        <span className="text-sm font-medium text-muted-foreground">Duration</span>
                        <span className="text-lg font-semibold text-secondary">{pkg.duration}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pkg.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full gradient-hero border-0 shadow-glow transition-smooth hover:scale-105 disabled:opacity-50 disabled:hover:scale-100" 
                      onClick={() => handlePurchase(pkg)}
                      disabled={!canAfford}
                    >
                      {canAfford ? 'Activate Package' : 'Insufficient Credits'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreditShop;
