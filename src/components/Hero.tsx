import { Button } from "@/components/ui/button";
import { MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Turn your time into rewards</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Discover Everything
            <br />
            <span className="gradient-hero bg-clip-text text-transparent">
              Happening Near You
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            From clubs to museums, concerts to coffee shops. Find every experience in your city, 
            with every detail you need. Earn credits for every moment you explore.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/explore">
              <Button variant="hero" size="lg" className="text-lg">
                <MapPin className="w-5 h-5" />
                Start Exploring
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg border-2"
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn How It Works
            </Button>
          </div>
          
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-xl gradient-card border border-border/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Venues</div>
            </div>
            <div className="p-6 rounded-xl gradient-card border border-border/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-secondary mb-2">500K+</div>
              <div className="text-muted-foreground">Credits Earned</div>
            </div>
            <div className="p-6 rounded-xl gradient-card border border-border/50 backdrop-blur-sm">
              <div className="text-3xl font-bold text-accent mb-2">24/7</div>
              <div className="text-muted-foreground">Live Updates</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
