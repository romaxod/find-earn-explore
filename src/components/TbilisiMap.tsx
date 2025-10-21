import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TbilisiMapProps {
  highlightEvent?: { lat: number; lng: number; id?: string };
  showDirections?: boolean;
}

const TbilisiMap = ({ highlightEvent, showDirections = true }: TbilisiMapProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const mapboxToken = "pk.eyJ1IjoiY2N0c2ciLCJhIjoiY21oMGt0dXM5MDE2bDJpcXRzYzltZHJ5ZSJ9.W7t4vJmOmCBUfHN5DPXwkw";

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [44.8271, 41.7151],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    getUserLocation();
    fetchEvents();

    return () => {
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !events.length) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Filter events based on highlightEvent - only show specific event if provided
    const eventsToShow = highlightEvent?.id ? events.filter((e) => e.id === highlightEvent.id) : events;

    // Add event markers
    eventsToShow.forEach((event) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.innerHTML = `
        <div class="marker-pin">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="hsl(160 85% 45%)" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
      `;

      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.location_lng, event.location_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: "event-popup", maxWidth: "320px" })
            .setHTML(
              `
              <div class="overflow-hidden">
                <div class="relative h-32 mb-3">
                  <img 
                    src="${event.image_url}" 
                    alt="${event.title}"
                    class="w-full h-full object-cover"
                    onerror="this.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80'"
                  />
                  <div class="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium" style="background: hsl(160 85% 45%); color: white;">
                    ${event.category}
                  </div>
                </div>
                <div class="px-3 pb-3">
                  <h3 class="font-bold text-base mb-2">${event.title}</h3>
                  <div class="space-y-1 mb-3 text-xs opacity-80">
                    <div class="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>${event.location_name}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>${new Date(event.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>${new Date(event.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                    </div>
                    <div class="flex items-center gap-1 font-semibold" style="color: hsl(160 85% 45%);">
                      <span>${event.price} ₾</span>
                    </div>
                  </div>
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
              </div>
            `,
            )
            .on("open", () => {
              // Add click listener when popup opens
              const btn = document.querySelector(`[data-event-id="${event.id}"]`);
              if (btn) {
                btn.addEventListener("click", () => navigate(`/event/${event.id}`));
              }
            }),
        )
        .addTo(map.current);

      markers.current.push(marker);

      // Add click handler for marker
      el.addEventListener("click", () => {
        marker.togglePopup();
      });
    });

    // Draw routes from user location to all events
    if (userLocation && map.current) {
      drawRoutesToEvents();
    }
  }, [events, userLocation, navigate, highlightEvent, showDirections]);

  useEffect(() => {
    if (highlightEvent && map.current) {
      map.current.flyTo({
        center: [highlightEvent.lng, highlightEvent.lat],
        zoom: 15,
        duration: 2000,
      });

      // Redraw routes when highlighting a specific event or showDirections changes
      if (userLocation && events.length > 0) {
        drawRoutesToEvents();
      }
    }
  }, [highlightEvent, userLocation, events, showDirections]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);

          if (map.current) {
            // Add user location marker
            const el = document.createElement("div");
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
        },
      );
    }
  };

  const drawRoutesToEvents = async () => {
    if (!map.current || !userLocation || !events.length) return;

    // Remove existing route layers
    if (map.current.getLayer("routes")) {
      map.current.removeLayer("routes");
    }
    if (map.current.getSource("routes")) {
      map.current.removeSource("routes");
    }

    // Only draw routes if showDirections is true
    if (!showDirections) return;

    const routes: any[] = [];

    // Filter events based on highlightEvent
    const eventsToRoute = highlightEvent?.id ? events.filter((e) => e.id === highlightEvent.id) : []; // Only show route when there's a specific highlighted event

    for (const event of eventsToRoute) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${event.location_lng},${event.location_lat}?geometries=geojson&access_token=${mapboxToken}`,
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          routes.push(data.routes[0].geometry);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    }

    if (routes.length > 0 && map.current) {
      map.current.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: routes.map((geometry) => ({
            type: "Feature",
            properties: {},
            geometry,
          })),
        },
      });

      map.current.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("time", new Date().toISOString())
        .order("time", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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
          border-radius: 0.75rem !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .mapboxgl-popup-tip {
          border-top-color: hsl(240 8% 8%) !important;
        }
        .mapboxgl-popup-close-button {
          color: white;
          font-size: 20px;
          padding: 4px 8px;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          margin: 4px;
        }
        .mapboxgl-popup-close-button:hover {
          background: rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default TbilisiMap;
