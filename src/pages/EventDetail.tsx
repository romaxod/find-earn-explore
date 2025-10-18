import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, ArrowLeft, Navigation } from "lucide-react";

const EventDetail = () => {
  const { id } = useParams();

  // Mock event data - will be replaced with real data later
  const event = {
    id,
    title: "Summer Jazz Night",
    category: "Music",
    location: "Blue Note Jazz Club",
    address: "123 Music Street, Downtown",
    time: "8:00 PM - 12:00 AM",
    date: "Friday, Oct 25",
    credits: 50,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
    description: "Experience an unforgettable evening of live jazz music featuring local and international artists. Immerse yourself in smooth melodies and vibrant rhythms.",
    details: [
      "Featured Artists: The Jazz Trio, Sarah Blues, Mike Saxophone",
      "Venue Capacity: 200 people",
      "Age Requirement: 18+",
      "Dress Code: Smart casual",
      "Food & Drinks: Full bar and light snacks available"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link to="/explore">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Button>
          </Link>

          <div className="space-y-6">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="text-sm">{event.category}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{event.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-medium">{event.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{event.credits}</div>
                  <div className="text-sm text-muted-foreground">credits</div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{event.location}</div>
                    <div className="text-sm text-muted-foreground">{event.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{event.date}</div>
                    <div className="text-sm text-muted-foreground">{event.time}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">About</h2>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">Details</h2>
                <ul className="space-y-2">
                  {event.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1 gap-2" size="lg">
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </Button>
                <Button variant="hero" className="flex-1" size="lg">
                  Check In & Earn Credits
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
