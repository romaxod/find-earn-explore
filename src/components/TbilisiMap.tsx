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

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number };
}

const TbilisiMap = ({ highlightEvent }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchEvents();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

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

  const GOOGLE_MAPS_API_KEY = "AIzaSyCoD1EK5FkFxndXLUR6ceOO7OBuLo_mnAw";

  return (
    <div className="w-full h-full">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={highlightEvent ? 14 : 13}
          center={highlightEvent || center}
          options={options}
        >
          {userLocation && !highlightEvent && (
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
              title="Your Location"
            />
          )}

          {!highlightEvent && events.map((event) => (
            <Marker
              key={event.id}
              position={{ lat: event.location_lat, lng: event.location_lng }}
              onClick={() => setSelectedEvent(event)}
              title={event.title}
            />
          ))}

          {highlightEvent && (
            <Marker
              position={highlightEvent}
              title="Event Location"
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
            />
          )}

          {selectedEvent && !highlightEvent && (
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
