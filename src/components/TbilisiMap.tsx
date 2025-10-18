import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
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
  showDirectionsTo?: { lat: number; lng: number };
}

const TbilisiMap = ({ showDirectionsTo }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchEvents();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (showDirectionsTo && userLocation) {
      calculateRoute(userLocation, showDirectionsTo);
    }
  }, [showDirectionsTo, userLocation]);

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
          toast({
            title: "Location access denied",
            description: "Please enable location access to see directions",
            variant: "destructive",
          });
        }
      );
    }
  };

  const calculateRoute = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!window.google) return;

    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirections(results);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast({
        title: "Route error",
        description: "Could not calculate route to destination",
        variant: "destructive",
      });
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
          zoom={showDirectionsTo ? 12 : 13}
          center={showDirectionsTo && directions ? undefined : center}
          options={options}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
              title="Your Location"
            />
          )}

          {!showDirectionsTo && events.map((event) => (
            <Marker
              key={event.id}
              position={{ lat: event.location_lat, lng: event.location_lng }}
              onClick={() => setSelectedEvent(event)}
              title={event.title}
            />
          ))}

          {showDirectionsTo && (
            <Marker
              position={showDirectionsTo}
              title="Event Location"
            />
          )}

          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: "#4F46E5",
                  strokeWeight: 5,
                },
              }}
            />
          )}

          {selectedEvent && !showDirectionsTo && (
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
