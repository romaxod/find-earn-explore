import { Compass, Award, Sparkles } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Compass,
      title: "Discover Everything",
      description: "Events, venues, museums, clubs, gyms, parks - every experience in your city with complete details including venue maps, DJ lineups, and precise schedules."
    },
    {
      icon: Award,
      title: "Earn While You Explore",
      description: "Your attendance is tracked and converted into credits. Redeem them for discounts at venues or partner businesses. The more you go out, the more you save."
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "AI learns from your visits and suggests experiences tailored to your taste. Get directions, time estimates, and everything you need to plan your perfect outing."
    }
  ];

  return (
    <section id="features" className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform how you experience your city
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl gradient-card border border-border/50 hover:border-primary/50 transition-smooth shadow-card hover:shadow-glow"
            >
              <div className="w-20 h-20 mb-6 rounded-xl bg-gradient-accent p-1">
                <div className="w-full h-full rounded-lg bg-card flex items-center justify-center">
                  <feature.icon 
                    className="w-10 h-10 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-smooth">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
