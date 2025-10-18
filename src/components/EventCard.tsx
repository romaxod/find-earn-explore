import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EventCardProps {
  title: string;
  category: string;
  location: string;
  time: string;
  credits: number;
  image: string;
  distance?: string;
}

export const EventCard = ({ 
  title, 
  category, 
  location, 
  time, 
  credits, 
  image,
  distance 
}: EventCardProps) => {
  return (
    <div className="group rounded-2xl overflow-hidden gradient-card border border-border/50 hover:border-primary/50 transition-smooth shadow-card hover:shadow-glow">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-primary text-primary-foreground shadow-lg">
            {category}
          </Badge>
        </div>
        {distance && (
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            {distance}
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold group-hover:text-primary transition-smooth line-clamp-2">
          {title}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent" />
            <span className="font-medium text-accent-foreground">Earn {credits} credits</span>
          </div>
        </div>
        
        <Button variant="accent" className="w-full">
          View Details
        </Button>
      </div>
    </div>
  );
};
