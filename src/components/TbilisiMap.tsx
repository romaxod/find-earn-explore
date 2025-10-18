import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

const center = {
  lat: 41.7151,
  lng: 44.8271,
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const TbilisiMap = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
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
        description: "Failed to load events on map",
        variant: "destructive",
      });
    }
  };

  const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE"; // Replace with your API key

  // Show message if API key is not configured
  if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-6 space-y-3">
          <h3 className="text-lg font-semibold">Google Maps API Key Required</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            To display the map, you need to add your own Google Maps API key with billing enabled.
            <br />Replace "YOUR_GOOGLE_MAPS_API_KEY_HERE" in TbilisiMap.tsx with your key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={center}
          options={options}
        >
          {events.map((event) => (
            <Marker
              key={event.id}
              position={{ lat: event.location_lat, lng: event.location_lng }}
              onClick={() => setSelectedEvent(event)}
              title={event.title}
            />
          ))}

          {selectedEvent && (
            <InfoWindow
              position={{ lat: selectedEvent.location_lat, lng: selectedEvent.location_lng }}
              onCloseClick={() => setSelectedEvent(null)}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-lg mb-1">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedEvent.category}</p>
                <p className="text-sm mb-2">{selectedEvent.location_name}</p>
                <p className="text-sm mb-3">
                  {new Date(selectedEvent.time).toLocaleDateString()}
                </p>
                <Link to={`/event/${selectedEvent.id}`}>
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default TbilisiMap;
