import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const Explore = () => {
  const categories = [
    "All", "Nightlife", "Music", "Arts", "Food", "Sports", "Culture", "Wellness"
  ];
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const mockEvents = [
    {
      title: "Electric Sunset: Summer Rooftop Party",
      category: "Nightlife",
      location: "Sky Lounge, Downtown",
      time: "Tonight, 9 PM - 3 AM",
      credits: 150,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      distance: "1.2 km"
    },
    {
      title: "Contemporary Art Exhibition: Urban Dreams",
      category: "Arts",
      location: "Modern Art Museum",
      time: "Today, 10 AM - 8 PM",
      credits: 80,
      image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80",
      distance: "2.5 km"
    },
    {
      title: "Jazz Under the Stars",
      category: "Music",
      location: "Central Park Amphitheater",
      time: "Tomorrow, 7 PM - 11 PM",
      credits: 120,
      image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
      distance: "800 m"
    },
    {
      title: "Michelin Star Pop-Up Experience",
      category: "Food",
      location: "The Culinary Space",
      time: "This Friday, 6 PM - 10 PM",
      credits: 200,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      distance: "3.1 km"
    },
    {
      title: "Sunrise Yoga in the Park",
      category: "Wellness",
      location: "Riverside Park",
      time: "Every Morning, 6 AM - 7:30 AM",
      credits: 60,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      distance: "1.8 km"
    },
    {
      title: "Underground Techno Marathon",
      category: "Nightlife",
      location: "The Basement Club",
      time: "Saturday, 11 PM - 6 AM",
      credits: 180,
      image: "https://images.unsplash.com/photo-1571266028243-d220c82ae8a5?w=800&q=80",
      distance: "2.2 km"
    }
  ];
  
  const filteredEvents = selectedCategory === "All" 
    ? mockEvents 
    : mockEvents.filter(event => event.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Explore <span className="gradient-hero bg-clip-text text-transparent">Your City</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover experiences happening right now, near you
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search events, venues, activities..." 
                className="pl-10 h-12 bg-card border-border"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-smooth"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={index} {...event} />
            ))}
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No events found in this category. Try selecting a different one!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
