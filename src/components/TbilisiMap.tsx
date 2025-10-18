import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

const TbilisiMap = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Tbilisi coordinates
  const center = {
    lat: 41.7151,
    lng: 44.8271
  };

  // Popular locations in Tbilisi
  const locations = [
    { name: 'Old Town', position: { lat: 41.6938, lng: 44.8098 } },
    { name: 'Freedom Square', position: { lat: 41.6941, lng: 44.8083 } },
    { name: 'Rustaveli Avenue', position: { lat: 41.6970, lng: 44.7972 } },
    { name: 'Narikala Fortress', position: { lat: 41.6884, lng: 44.8082 } },
    { name: 'Bridge of Peace', position: { lat: 41.6922, lng: 44.8091 } },
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  };

  return (
    <div className="w-full h-full">
      <LoadScript googleMapsApiKey="AIzaSyCoD1EK5FkFxndXLUR6ceOO7OBuLo_mnAw">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          options={options}
        >
          {locations.map((location) => (
            <Marker
              key={location.name}
              position={location.position}
              onClick={() => setSelectedLocation(location.name)}
            />
          ))}

          {selectedLocation && (
            <InfoWindow
              position={locations.find(l => l.name === selectedLocation)?.position!}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div className="p-2">
                <strong>{selectedLocation}</strong>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default TbilisiMap;
