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
      id: "1",
      title: "Bassiani: Techno Night with International DJs",
      category: "Nightlife",
      location: "Bassiani Club, Dinamo Stadium",
      time: "Friday, 11 PM - 8 AM",
      credits: 200,
      image: "https://images.unsplash.com/photo-1571266028243-d220c82ae8a5?w=800&q=80",
      distance: "2.1 km"
    },
    {
      id: "2",
      title: "Contemporary Georgian Art Exhibition",
      category: "Arts",
      location: "Tbilisi History Museum",
      time: "Daily, 11 AM - 7 PM",
      credits: 80,
      image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80",
      distance: "1.5 km"
    },
    {
      id: "3",
      title: "Live Jazz at Dive Bar",
      category: "Music",
      location: "Dive Bar, Aghmashenebeli Ave",
      time: "Thursday, 9 PM - 1 AM",
      credits: 100,
      image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
      distance: "900 m"
    },
    {
      id: "4",
      title: "Georgian Wine Tasting Experience",
      category: "Food",
      location: "Vino Underground, Old Tbilisi",
      time: "Every Evening, 6 PM - 10 PM",
      credits: 150,
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
      distance: "1.8 km"
    },
    {
      id: "5",
      title: "Yoga on the Mtatsminda",
      category: "Wellness",
      location: "Mtatsminda Park",
      time: "Every Morning, 7 AM - 8:30 AM",
      credits: 60,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      distance: "3.2 km"
    },
    {
      id: "6",
      title: "Khidi: Underground Electronic Session",
      category: "Nightlife",
      location: "Khidi Club, near Railway Station",
      time: "Saturday, 12 AM - 9 AM",
      credits: 180,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      distance: "2.8 km"
    },
    {
      id: "7",
      title: "Tbilisi Open Air Festival",
      category: "Music",
      location: "Lisi Lake",
      time: "June 15-16, 2 PM - 12 AM",
      credits: 250,
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
      distance: "6.5 km"
    },
    {
      id: "8",
      title: "Cafe Gallery: Indie Music Night",
      category: "Music",
      location: "Cafe Gallery, Vera",
      time: "Wednesday, 8 PM - 12 AM",
      credits: 90,
      image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
      distance: "1.1 km"
    },
    {
      id: "9",
      title: "Fabrika: Rooftop Cinema Under Stars",
      category: "Culture",
      location: "Fabrika Tbilisi",
      time: "Every Friday, 9 PM",
      credits: 70,
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
      distance: "1.6 km"
    },
    {
      id: "10",
      title: "Traditional Georgian Supra Feast",
      category: "Food",
      location: "Shavi Lomi Restaurant",
      time: "Saturday, 7 PM - 11 PM",
      credits: 220,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      distance: "2.3 km"
    },
    {
      id: "11",
      title: "Mtkvarze: Riverside Party",
      category: "Nightlife",
      location: "Mtkvarze Bar, Mtkvari Embankment",
      time: "Tonight, 10 PM - 4 AM",
      credits: 120,
      image: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=800&q=80",
      distance: "800 m"
    },
    {
      id: "12",
      title: "Tbilisi Street Food Festival",
      category: "Food",
      location: "Rike Park",
      time: "This Weekend, 12 PM - 10 PM",
      credits: 50,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
      distance: "1.3 km"
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
              Explore <span className="gradient-hero-text">Your City</span>
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
