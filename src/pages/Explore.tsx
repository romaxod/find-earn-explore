import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

const Explore = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const categories = [
    "All", "Nightlife", "Music", "Arts", "Food", "Sports", "Culture", "Wellness"
  ];
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "week">("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    
    if (session?.user) {
      fetchRecommendations();
    } else {
      fetchAllEvents();
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-recommendations');
      
      if (error) throw error;
      
      if (data?.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load personalized recommendations",
        variant: "destructive",
      });
      fetchAllEvents();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('time', new Date().toISOString())
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const eventDate = new Date(event.time);
    const now = new Date();
    
    let matchesDate = true;
    
    // If specific date is selected
    if (selectedDate) {
      matchesDate = format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }
    // Date filter logic
    else if (dateFilter === "today") {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      matchesDate = eventDate >= todayStart && eventDate <= todayEnd;
    } else if (dateFilter === "tomorrow") {
      const tomorrow = addDays(now, 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);
      matchesDate = eventDate >= tomorrowStart && eventDate <= tomorrowEnd;
    } else if (dateFilter === "week") {
      const weekStart = now; // Start from today
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Until end of week (Sunday)
      matchesDate = eventDate >= startOfDay(weekStart) && eventDate <= endOfDay(weekEnd);
    }
    
    return matchesCategory && matchesSearch && matchesDate;
  });

  const handleDateFilterClick = (filter: "all" | "today" | "tomorrow" | "week") => {
    // Toggle off if clicking the same filter
    if (dateFilter === filter) {
      setDateFilter("all");
    } else {
      setDateFilter(filter);
    }
    setSelectedDate(undefined); // Clear specific date selection
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {user ? "Your Personalized " : "Explore "}
              <span className="gradient-hero-text">Events</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {user 
                ? "Events tailored to your interests and past attendance"
                : "Discover amazing experiences in Tbilisi"
              }
            </p>
            {!user && (
              <Button onClick={() => navigate('/auth')} variant="outline">
                Sign in for personalized recommendations
              </Button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search events, venues, activities..." 
                className="pl-10 h-12 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <Button 
                variant={dateFilter === "today" ? "default" : "outline"} 
                className="h-12 px-4"
                onClick={() => handleDateFilterClick("today")}
              >
                Today
              </Button>
              <Button 
                variant={dateFilter === "tomorrow" ? "default" : "outline"} 
                className="h-12 px-4"
                onClick={() => handleDateFilterClick("tomorrow")}
              >
                Tomorrow
              </Button>
              <Button 
                variant={dateFilter === "week" ? "default" : "outline"} 
                className="h-12 px-4"
                onClick={() => handleDateFilterClick("week")}
              >
                This Week
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-12 px-6 gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {selectedDate ? format(selectedDate, "MMM dd") : "Date"}
                    {selectedDate && (
                      <X 
                        className="w-4 h-4 ml-1 hover:text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(undefined);
                          setDateFilter("all");
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDateFilter("all");
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
          
          {loading ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">Loading events...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    category={event.category}
                    location={event.location_name}
                    time={new Date(event.time).toLocaleDateString() + ' ' + new Date(event.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    credits={event.price}
                    image={event.image_url}
                  />
                ))}
              </div>
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">
                    No events found. Try selecting a different category!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
