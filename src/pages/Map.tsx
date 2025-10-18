import { Navbar } from "@/components/Navbar";
import TbilisiMap from "@/components/TbilisiMap";

const Map = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-8 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Explore Tbilisi
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover amazing events and venues across the city
            </p>
          </div>

          <div className="h-[600px] w-full">
            <TbilisiMap />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Map;
