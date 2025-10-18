import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, User, Coins } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold group-hover:text-primary transition-smooth">
              EventFlow
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/explore">
              <Button variant="ghost" className="gap-2">
                <MapPin className="w-4 h-4" />
                Explore
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="ghost" className="gap-2">
                <MapPin className="w-4 h-4" />
                Map
              </Button>
            </Link>
            <Link to="/credits">
              <Button variant="ghost" className="gap-2">
                <Coins className="w-4 h-4" />
                Credits
              </Button>
            </Link>
            <Button variant="ghost" className="gap-2" onClick={() => alert('Sign in coming soon!')}>
              <User className="w-4 h-4" />
              Sign In
            </Button>
            <Link to="/explore">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
