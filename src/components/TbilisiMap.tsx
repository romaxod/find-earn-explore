import { useEffect, useRef, useState } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number };
}

const TbilisiMap = ({ highlightEvent }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const mapboxToken = 'pk.eyJ1IjoiY2N0c2ciLCJhIjoiY21nd294ZmRtMTNjOTJrczJwNzFrZGF1MCJ9.waMaQH12VZD8plcIcYe9AA';

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [44.8271, 41.7151],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    getUserLocation();
    fetchEvents();

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !events.length) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add event markers
    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="marker-pin">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="hsl(160 85% 45%)" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
      `;
      
      el.style.cursor = 'pointer';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.location_lng, event.location_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: 'event-popup' })
            .setHTML(`
              <div class="p-3 min-w-[200px]">
                <h3 class="font-bold text-base mb-1">${event.title}</h3>
                <p class="text-xs opacity-70 mb-2">${event.category}</p>
                <p class="text-xs mb-2">${event.location_name}</p>
                <p class="text-xs mb-2">${new Date(event.time).toLocaleDateString()}</p>
                <button 
                  class="view-event-btn w-full py-2 px-3 rounded text-sm font-medium transition-smooth"
                  data-event-id="${event.id}"
                  style="background: hsl(160 85% 45%); color: white;"
                  onmouseover="this.style.background='hsl(160 85% 55%)'"
                  onmouseout="this.style.background='hsl(160 85% 45%)'"
                >
                  View Details
                </button>
              </div>
            `)
        )
        .addTo(map.current);

      markers.current.push(marker);

      // Add click handler for marker
      el.addEventListener('click', () => {
        marker.togglePopup();
      });
    });

    // Add click listeners for buttons in popups
    setTimeout(() => {
      document.querySelectorAll('.view-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const eventId = (e.target as HTMLElement).dataset.eventId;
          if (eventId) navigate(`/event/${eventId}`);
        });
      });
    }, 100);

    // Draw routes from user location to all events
    if (userLocation && map.current) {
      drawRoutesToEvents();
    }
  }, [events, userLocation, navigate]);

  useEffect(() => {
    if (highlightEvent && map.current) {
      map.current.flyTo({
        center: [highlightEvent.lng, highlightEvent.lat],
        zoom: 15,
        duration: 2000
      });
    }
  }, [highlightEvent]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          
          if (map.current) {
            // Add user location marker
            const el = document.createElement('div');
            el.innerHTML = `
              <div class="user-marker">
                <div class="pulse"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="hsl(35 95% 60%)" stroke="white" stroke-width="3"/>
                </svg>
              </div>
            `;
            
            new mapboxgl.Marker(el)
              .setLngLat(coords)
              .setPopup(new mapboxgl.Popup().setHTML('<p class="text-sm font-medium">Your Location</p>'))
              .addTo(map.current);
          }
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
    if (!map.current || !userLocation || !events.length) return;

    // Remove existing route layers
    if (map.current.getLayer('routes')) {
      map.current.removeLayer('routes');
    }
    if (map.current.getSource('routes')) {
      map.current.removeSource('routes');
    }

    const routes: any[] = [];

    for (const event of events) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${event.location_lng},${event.location_lat}?geometries=geojson&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          routes.push(data.routes[0].geometry);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    }

    if (routes.length > 0 && map.current) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routes.map(geometry => ({
            type: 'Feature',
            properties: {},
            geometry
          }))
        }
      });

      map.current.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'hsl(160 85% 45%)',
          'line-width': 3,
          'line-opacity': 0.6
        }
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


  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <style>{`
        .custom-marker {
          cursor: pointer;
          transition: transform 0.2s;
        }
        .custom-marker:hover {
          transform: scale(1.1);
        }
        .marker-pin {
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }
        .user-marker {
          position: relative;
        }
        .pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(35 95% 60% / 0.5);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
        .mapboxgl-popup-content {
          background: hsl(240 8% 8%) !important;
          color: hsl(240 5% 98%) !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: hsl(240 8% 8%) !important;
        }
      `}</style>
    </div>
  );
};

export default TbilisiMap;
