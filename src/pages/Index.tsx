import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      
      <section className="py-24 px-4 bg-gradient-accent">
        <div className="container max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-primary-foreground/90">
            Join thousands of explorers already earning credits and discovering the best of their city.
          </p>
          <div className="pt-4">
            <Link to="/explore">
              <button className="px-8 py-4 text-lg font-semibold bg-background text-foreground rounded-lg hover:bg-background/90 transition-smooth shadow-lg">
                Start Exploring Now
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
