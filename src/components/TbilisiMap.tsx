import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const TbilisiMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [44.8271, 41.7151], // Tbilisi coordinates
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Popular locations in Tbilisi
    const locations = [
      { name: 'Old Town', coords: [44.8098, 41.6938] },
      { name: 'Freedom Square', coords: [44.8083, 41.6941] },
      { name: 'Rustaveli Avenue', coords: [44.7972, 41.6970] },
      { name: 'Narikala Fortress', coords: [44.8082, 41.6884] },
      { name: 'Bridge of Peace', coords: [44.8091, 41.6922] },
    ];

    // Add markers for popular locations
    locations.forEach(location => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2"><strong>${location.name}</strong></div>`
      );

      new mapboxgl.Marker({ color: '#8B5CF6' })
        .setLngLat(location.coords as [number, number])
        .setPopup(popup)
        .addTo(map.current!);
    });

    setIsMapLoaded(true);
  };

  const handleLoadMap = () => {
    if (apiKey.trim()) {
      initializeMap(apiKey);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-full">
      {!isMapLoaded ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 bg-card rounded-lg border border-border">
          <MapPin className="w-12 h-12 text-primary" />
          <h3 className="text-xl font-semibold">Tbilisi Map</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Enter your Mapbox public token to view the interactive map of Tbilisi.
            Get your token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="flex gap-2 w-full max-w-md">
            <Input
              type="text"
              placeholder="Enter Mapbox public token"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLoadMap} disabled={!apiKey.trim()}>
              Load Map
            </Button>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full rounded-lg shadow-lg" />
      )}
    </div>
  );
};

export default TbilisiMap;
