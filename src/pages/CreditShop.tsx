import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Coffee, Wine, Percent, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const CreditShop = () => {
  const [userCredits, setUserCredits] = useState(150);

  const deals = [
    {
      id: 1,
      company: "McDonald's",
      offer: "Free Big Mac with any purchase",
      credits: 20,
      category: "Fast Food",
      icon: Utensils,
      location: "Multiple locations",
      image: "🍔",
      color: "text-red-500"
    },
    {
      id: 2,
      company: "KFC",
      offer: "30% off on bucket meals",
      credits: 15,
      category: "Fast Food",
      icon: Utensils,
      location: "Multiple locations",
      image: "🍗",
      color: "text-red-600"
    },
    {
      id: 3,
      company: "Café Littera",
      offer: "Complimentary dessert with main course",
      credits: 25,
      category: "Fine Dining",
      icon: Coffee,
      location: "13 Machabeli St, Tbilisi",
      image: "🍰",
      color: "text-amber-600"
    },
    {
      id: 4,
      company: "Shavi Lomi",
      offer: "20% off total bill",
      credits: 30,
      category: "Georgian Cuisine",
      icon: Utensils,
      location: "14 Marjanishvili St, Tbilisi",
      image: "🍖",
      color: "text-orange-500"
    },
    {
      id: 5,
      company: "Fabrika",
      offer: "Buy 2 cocktails, get 1 free",
      credits: 25,
      category: "Bar & Lounge",
      icon: Wine,
      location: "8 Egnate Ninoshvili St, Tbilisi",
      image: "🍸",
      color: "text-purple-500"
    },
    {
      id: 6,
      company: "Stamba Hotel Bar",
      offer: "50% off craft cocktails",
      credits: 35,
      category: "Premium Bar",
      icon: Wine,
      location: "14 Merab Kostava St, Tbilisi",
      image: "🍹",
      color: "text-pink-500"
    },
    {
      id: 7,
      company: "Culinarium",
      offer: "Free appetizer for groups of 4+",
      credits: 40,
      category: "Restaurant",
      icon: Utensils,
      location: "31 Shavteli St, Tbilisi",
      image: "🥗",
      color: "text-green-500"
    },
    {
      id: 8,
      company: "Café Leila",
      offer: "2 for 1 on specialty coffee",
      credits: 10,
      category: "Coffee Shop",
      icon: Coffee,
      location: "7 Ioseb Grishashvili St, Tbilisi",
      image: "☕",
      color: "text-brown-500"
    },
    {
      id: 9,
      company: "Berbarestan",
      offer: "Complimentary wine tasting",
      credits: 45,
      category: "Georgian Fine Dining",
      icon: Wine,
      location: "132 Rustaveli Ave, Tbilisi",
      image: "🍷",
      color: "text-red-700"
    },
    {
      id: 10,
      company: "Rooms Hotel Bar",
      offer: "Free starter with any order",
      credits: 30,
      category: "Hotel Bar",
      icon: Wine,
      location: "14 Merab Kostava St, Tbilisi",
      image: "🥂",
      color: "text-blue-500"
    },
    {
      id: 11,
      company: "Dunkin' Donuts",
      offer: "Buy 6 donuts, get 3 free",
      credits: 12,
      category: "Coffee & Donuts",
      icon: Coffee,
      location: "Multiple locations",
      image: "🍩",
      color: "text-pink-400"
    },
    {
      id: 12,
      company: "Respublika Grill Bar",
      offer: "15% off entire menu",
      credits: 20,
      category: "Grill & Bar",
      icon: Utensils,
      location: "Kote Abkhazi St, Tbilisi",
      image: "🔥",
      color: "text-orange-600"
    }
  ];

  const handleRedeem = (deal: typeof deals[0]) => {
    if (userCredits >= deal.credits) {
      setUserCredits(userCredits - deal.credits);
      toast({
        title: "Deal Redeemed!",
        description: `You've redeemed ${deal.offer} at ${deal.company}. Show this to the staff.`,
      });
    } else {
      toast({
        title: "Insufficient Credits",
        description: `You need ${deal.credits} credits but only have ${userCredits}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Exclusive Deals & Discounts
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Redeem credits for amazing offers from top restaurants, cafes, and bars in Tbilisi
            </p>
            
            <Card className="max-w-md mx-auto bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Credits</p>
                    <p className="text-3xl font-bold text-primary">{userCredits}</p>
                  </div>
                  <Button variant="outline">
                    Buy More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const Icon = deal.icon;
              return (
                <Card 
                  key={deal.id} 
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl mb-2">{deal.image}</div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {deal.credits} credits
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{deal.company}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <Icon className={`w-4 h-4 ${deal.color}`} />
                      {deal.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="font-semibold text-primary">{deal.offer}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{deal.location}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleRedeem(deal)}
                      disabled={userCredits < deal.credits}
                    >
                      {userCredits >= deal.credits ? 'Redeem Now' : 'Not Enough Credits'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-16">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>How to Use Your Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Browse & Select</p>
                    <p className="text-sm text-muted-foreground">Choose your favorite deal from the collection above</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Redeem with Credits</p>
                    <p className="text-sm text-muted-foreground">Click redeem and use your credits to unlock the offer</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Show & Enjoy</p>
                    <p className="text-sm text-muted-foreground">Present the redeemed offer to staff at the location and enjoy!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreditShop;
