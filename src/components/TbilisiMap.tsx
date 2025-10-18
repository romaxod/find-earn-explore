import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = 'google_maps_api_key';
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number };
}

const TbilisiMap = ({ highlightEvent }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState<boolean>(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      setApiKey(savedToken);
      setIsTokenSet(true);
    }
  }, []);

  useEffect(() => {
    if (isTokenSet && isLoaded) {
      fetchEvents();
      getUserLocation();
    }
  }, [isTokenSet, isLoaded]);

  useEffect(() => {
    if (userLocation && events.length > 0 && isLoaded) {
      drawRoutesToEvents();
    }
  }, [userLocation, events, isLoaded]);

  useEffect(() => {
    if (highlightEvent && map) {
      map.panTo({ lat: highlightEvent.lat, lng: highlightEvent.lng });
      map.setZoom(15);
    }
  }, [highlightEvent, map]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Enable location to see routes to events",
            variant: "destructive",
          });
        }
      );
    }
  };

  const drawRoutesToEvents = async () => {
    if (!userLocation || !events.length || !window.google) return;

    const directionsService = new google.maps.DirectionsService();
    const allDirections: google.maps.DirectionsResult[] = [];

    for (const event of events) {
      try {
        const result = await directionsService.route({
          origin: userLocation,
          destination: { lat: event.location_lat, lng: event.location_lng },
          travelMode: google.maps.TravelMode.WALKING,
        });
        allDirections.push(result);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    }

    setDirections(allDirections);
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

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem(STORAGE_KEY, tokenInput.trim());
      setApiKey(tokenInput.trim());
      setIsTokenSet(true);
      toast({
        title: "API Key saved!",
        description: "Your Google Maps API key has been saved. The map will now load.",
      });
    }
  };

  if (!isTokenSet) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="max-w-md w-full p-6 space-y-4">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-xl font-bold">Google Maps API Key Required</h3>
            <p className="text-sm text-muted-foreground">
              To display the interactive map with routes, please enter your Google Maps API key.
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="AIzaSyB..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button onClick={handleSaveToken} className="w-full">
              Save API Key
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Get your API key at:</p>
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Google Cloud Console
            </a>
            <p className="pt-2">• Your key will be saved locally in your browser</p>
            <p>• Enable Maps JavaScript API and Directions API</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Loading map...</div>;
  }

  const mapStyles = {
    dark: [
      { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#888888" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    ]
  };

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={{ lat: 41.7151, lng: 44.8271 }}
      zoom={12}
      onLoad={setMap}
      options={{
        styles: mapStyles.dark,
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          }}
        />
      )}

      {events.map((event) => (
        <Marker
          key={event.id}
          position={{ lat: event.location_lat, lng: event.location_lng }}
          onClick={() => setSelectedEvent(event)}
          icon={{
            url: "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%2310b981' stroke='white' stroke-width='2'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
          }}
        />
      ))}

      {selectedEvent && (
        <InfoWindow
          position={{ lat: selectedEvent.location_lat, lng: selectedEvent.location_lng }}
          onCloseClick={() => setSelectedEvent(null)}
        >
          <div className="p-3 min-w-[200px]">
            <h3 className="font-bold text-base mb-1 text-gray-900">{selectedEvent.title}</h3>
            <p className="text-xs text-gray-600 mb-2">{selectedEvent.category}</p>
            <p className="text-xs mb-2 text-gray-700">{selectedEvent.location_name}</p>
            <p className="text-xs mb-2 text-gray-700">{new Date(selectedEvent.time).toLocaleDateString()}</p>
            <button 
              className="w-full py-2 px-3 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90"
              onClick={() => navigate(`/event/${selectedEvent.id}`)}
            >
              View Details
            </button>
          </div>
        </InfoWindow>
      )}

      {directions.map((direction, index) => (
        <DirectionsRenderer
          key={index}
          directions={direction}
          options={{
            polylineOptions: {
              strokeColor: "#10b981",
              strokeOpacity: 0.6,
              strokeWeight: 3,
            },
            suppressMarkers: true,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default TbilisiMap;
