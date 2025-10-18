import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CreditShop = () => {
  const packages = [
    {
      id: 1,
      name: "Starter Pack",
      credits: 100,
      price: 9.99,
      icon: Coins,
      popular: false,
      discount: "Perfect for beginners"
    },
    {
      id: 2,
      name: "Explorer Pack",
      credits: 300,
      price: 24.99,
      icon: Sparkles,
      popular: true,
      discount: "Save 15% - Most Popular"
    },
    {
      id: 3,
      name: "Adventure Pack",
      credits: 600,
      price: 44.99,
      icon: Zap,
      popular: false,
      discount: "Save 25%"
    },
    {
      id: 4,
      name: "Premium Pack",
      credits: 1200,
      price: 79.99,
      icon: Crown,
      popular: false,
      discount: "Save 35% - Best Value"
    }
  ];

  const handlePurchase = (packageName: string, credits: number) => {
    toast({
      title: "Purchase Successful!",
      description: `You've purchased ${credits} credits from the ${packageName}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Credit Shop
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purchase credits to unlock exclusive discounts and rewards at your favorite venues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card 
                  key={pkg.id} 
                  className={`relative transition-smooth hover:shadow-card ${
                    pkg.popular ? 'border-primary shadow-card' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full shadow-glow">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-hero flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription className="text-primary font-semibold">
                      {pkg.discount}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-4">
                    <div className="text-4xl font-bold">
                      {pkg.credits}
                      <span className="text-lg text-muted-foreground ml-1">credits</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      ${pkg.price}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant={pkg.popular ? "hero" : "default"}
                      onClick={() => handlePurchase(pkg.name, pkg.credits)}
                    >
                      Purchase Now
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center space-y-4">
            <h3 className="text-2xl font-bold">How Credits Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold mb-2">Earn Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Purchase credits here or earn them by checking in at events
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold mb-2">Unlock Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Use credits to unlock exclusive discounts and special offers
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="font-semibold mb-2">Save Money</h4>
                <p className="text-sm text-muted-foreground">
                  The more you explore, the more you save on future experiences
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreditShop;
