import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number };
}

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  time: string;
  category: string;
  price: number;
  image_url?: string;
}

const eventIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ center, zoom }: { center?: LatLngExpression; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 2 });
    }
  }, [center, zoom, map]);
  
  return null;
}

const TbilisiMap = ({ highlightEvent }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [flyToCenter, setFlyToCenter] = useState<LatLngExpression | undefined>();
  const [flyToZoom, setFlyToZoom] = useState<number | undefined>();

  useEffect(() => {
    fetchEvents();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (highlightEvent) {
      setFlyToCenter([highlightEvent.lat, highlightEvent.lng]);
      setFlyToZoom(15);
    }
  }, [highlightEvent]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Enable location to see your position on the map",
            variant: "destructive",
          });
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

  const getDirections = (eventLat: number, eventLng: number) => {
    if (userLocation) {
      const loc = userLocation as [number, number];
      const url = `https://www.google.com/maps/dir/?api=1&origin=${loc[0]},${loc[1]}&destination=${eventLat},${eventLng}&travelmode=walking`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Location not available",
        description: "Please enable location access to get directions",
        variant: "destructive",
      });
    }
  };

  const defaultCenter: LatLngExpression = [41.7151, 44.8271];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <MapController center={flyToCenter} zoom={flyToZoom} />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">Your Location</div>
            </Popup>
          </Marker>
        )}

        {events.map((event) => {
          const eventPosition: LatLngExpression = [event.location_lat, event.location_lng];
          return (
            <Marker
              key={event.id}
              position={eventPosition}
              icon={eventIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-base mb-1 text-gray-900">{event.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{event.category}</p>
                  <p className="text-xs mb-2 text-gray-700">{event.location_name}</p>
                  <p className="text-xs mb-2 text-gray-700">
                    {new Date(event.time).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => getDirections(event.location_lat, event.location_lng)}
                      className="flex-1 text-xs"
                    >
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="flex-1 text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TbilisiMap;
