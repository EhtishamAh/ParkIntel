"use client"

// Import CSS files first
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import { useState, useEffect, useRef } from 'react';
// Import mapbox-gl itself to get the namespace for types
import mapboxgl from 'mapbox-gl'; 

// Import from react-map-gl
import Map, {
  MapRef,
  Source,
  Layer,
  Popup,
  GeolocateControl,
  NavigationControl,
  useControl,
  LayerProps,
  ControlPosition,
} from 'react-map-gl';

// Import Geocoder and its types
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

// Import local components
import { supabase } from '@/lib/supabase';
// ****** We now import getFakePrediction HERE ******
import { getFakePrediction } from '@/lib/prediction'; 
import { PopupContent, type ParkingLot } from './PopupContent'; // Import the type

// Define the structure for the GeoJSON features
type AppGeoJSONFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  // The properties now include the ParkingLot AND the prediction
  properties: ParkingLot & { probability: number };
};

// This wrapper class makes the Geocoder compatible with react-map-gl's IControl interface
class GeocoderControl implements mapboxgl.IControl {
  _geocoder: MapboxGeocoder;
  _container: HTMLElement;
  _options: MapboxGeocoder.Options;

  constructor(options: MapboxGeocoder.Options) {
    this._options = options;
    this._geocoder = new MapboxGeocoder(options);
  }

  onAdd(map: mapboxgl.Map) {
    this._container = this._geocoder.onAdd(map);
    return this._container;
  }

  onRemove() {
    this._geocoder.onRemove();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }

  getDefaultPosition(): ControlPosition {
    return this._options.position as ControlPosition || 'top-left';
  }
}

// --- 1. Main Map Component ---
export default function MainMap() {
  const mapRef = useRef<MapRef | null>(null);

  // --- 2. Load the Basic Map ---
  const [initialViewState, setInitialViewState] = useState({
    longitude: 73.0479, // Default: Islamabad
    latitude: 33.6844,
    zoom: 12,
  });
  const [locationError, setLocationError] = useState(false);

  // --- 3. Get the User's Current Location ---
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
      },
      (error) => {
        console.warn('Error getting geolocation:', error.message);
        setLocationError(true);
      }
    );
  }, []);

  // --- 5. Load Parking Pins (from Supabase) ---
  const [parkingLots, setParkingLots] = useState<AppGeoJSONFeature[]>([]);

  useEffect(() => {
    const fetchLots = async () => {
      const { data, error } = await supabase.from('ParkingLots').select('*');
      if (error) {
        console.error('Error fetching parking lots:', error);
        return;
      }
      
      // Run prediction on load
      const features: AppGeoJSONFeature[] = (data as ParkingLot[]).map((lot: ParkingLot) => {
        const prediction = getFakePrediction(lot.id);
        
        return {
          type: 'Feature',
          geometry: { type: "Point", coordinates: [lot.lng, lot.lat] },
          // Store the lot data AND the probability in the properties
          properties: {
            ...lot,
            probability: prediction.probability 
          },
        }
      });
      setParkingLots(features);
    };
    fetchLots();
  }, []);

  // Format data for Mapbox Source
  const geoJsonData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: 'FeatureCollection',
    features: parkingLots,
  };

  // --- 6. Make Pins Clickable (Popup Logic) ---
  const [popupInfo, setPopupInfo] = useState<mapboxgl.MapboxGeoJSONFeature | null>(null);

  const onMapClick = (event: mapboxgl.MapLayerMouseEvent) => {
    const features = event.features;
    if (!features || features.length === 0) {
      setPopupInfo(null);
      return;
    }

    const clickedFeature = features[0];
    const properties = clickedFeature.properties;
    
    if (properties?.cluster === true) {
      const clusterId = properties.cluster_id;
      const map = mapRef.current?.getMap();
      const source = map?.getSource('parking-lots') as mapboxgl.GeoJSONSource;

      source?.getClusterExpansionZoom(clusterId, (err?: Error, zoom?: number) => {
        if (err || !zoom) return;
        map?.easeTo({
          center: (clickedFeature.geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom,
        });
      });
    } else {
      setPopupInfo(clickedFeature);
    }
  };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY!}
      initialViewState={initialViewState}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={['clusters', 'unclustered-point']}
      onClick={onMapClick}
    >
      <GeocoderControlWrapper />
      
      {/* --- FIX: Disable the giant accuracy circle --- */}
      <GeolocateControl 
        position="top-right" 
        showAccuracyCircle={false} 
        showUserHeading={true}
      />
      
      <NavigationControl position="top-right" />

      <Source
        id="parking-lots"
        type="geojson"
        data={geoJsonData}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        <Layer {...unclusteredPointLayer} />
      </Source>

      {popupInfo && popupInfo.geometry.type === 'Point' && (
        <Popup
          longitude={popupInfo.geometry.coordinates[0]}
          latitude={popupInfo.geometry.coordinates[1]}
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          anchor="top"
        >
          <PopupContent
            lot={popupInfo.properties as unknown as ParkingLot} // Cast properties
            userLocation={userLocation}
          />
        </Popup>
      )}

      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-4 py-2 text-white shadow-lg">
          Could not get your location. Showing default view.
        </div>
      )}
    </Map>
  );
}

// --- Geocoder Control Component (Wrapper) ---
function GeocoderControlWrapper() {
  useControl(() => new GeocoderControl({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_API_KEY!,
      mapboxgl: mapboxgl,
      placeholder: 'Search for a location...',
      countries: 'pk',
      marker: false, 
    }), { position: 'top-left' });
  return null;
}

// --- Layer Styling Definitions ---

// --- FIX: Modern cluster colors ---
const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'parking-lots',
  filter: ['has', 'point_count'],
  paint: {
    // Use a modern Indigo/Purple color ramp
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#6366F1', // Indigo (for < 10 pins)
      10,
      '#8B5CF6', // Purple (for < 30 pins)
      30,
      '#EC4899'  // Pink (for 30+ pins)
    ],
    'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
};

const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'parking-lots',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 14
  },
  paint: {
    'text-color': '#ffffff'
  }
};

// --- FIX: This is the large, colored circle for individual pins ---
const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle', // Use a circle, not a pin icon
  source: 'parking-lots',
  filter: ['!', ['has', 'point_count']],
  paint: {
    // Color-code the circle based on probability
    'circle-color': [
      'step',
      ['get', 'probability'], 
      '#f44336', // RED: (0-49) High risk, low availability
      50,
      '#ff9800', // ORANGE: (50-74) Medium risk
      75,
      '#4caf50'  // GREEN: (75-100) Low risk, high availability
    ],
    'circle-radius': 10, // A larger 10px circle
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff' // A white border to make it pop
  }
};