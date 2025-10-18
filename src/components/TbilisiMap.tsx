import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = '43dfc4b3-4a0b-439f-8e5d-a6757ed28d31';

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number };
}

const TbilisiMap = ({ highlightEvent }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routes, setRoutes] = useState<google.maps.LatLngLiteral[][]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['marker'],
  });

  useEffect(() => {
    if (isLoaded) {
      getUserLocation();
      fetchEvents();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (userLocation && events.length > 0) {
      drawRoutesToEvents();
    }
  }, [events, userLocation]);

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
    if (!userLocation || !events.length) return;

    const newRoutes: google.maps.LatLngLiteral[][] = [];

    for (const event of events) {
      const directionsService = new google.maps.DirectionsService();
      
      try {
        const result = await directionsService.route({
          origin: userLocation,
          destination: { lat: event.location_lat, lng: event.location_lng },
          travelMode: google.maps.TravelMode.WALKING,
        });

        if (result.routes[0]) {
          const path = result.routes[0].overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng(),
          }));
          newRoutes.push(path);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    }

    setRoutes(newRoutes);
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

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center">Loading map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      center={{ lat: 41.7151, lng: 44.8271 }}
      zoom={12}
      options={{
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: false,
        zoomControl: true,
      }}
      onLoad={setMap}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: 'hsl(35 95% 60%)',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3,
          }}
        />
      )}

      {/* Event markers */}
      {events.map((event) => (
        <Marker
          key={event.id}
          position={{ lat: event.location_lat, lng: event.location_lng }}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: 'hsl(160 85% 45%)',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
          }}
          onClick={() => navigate(`/event/${event.id}`)}
          title={event.title}
        />
      ))}

      {/* Routes */}
      {routes.map((route, index) => (
        <Polyline
          key={index}
          path={route}
          options={{
            strokeColor: 'hsl(160 85% 45%)',
            strokeOpacity: 0.6,
            strokeWeight: 3,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default TbilisiMap;
