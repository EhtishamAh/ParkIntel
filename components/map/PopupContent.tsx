"use client"

import { useEffect, useState } from 'react';
import { getFakePrediction } from '@/lib/prediction';
import { BrainCircuit, DollarSign, Clock, Navigation } from 'lucide-react';

// Define the type for the lot's properties and EXPORT it
export type ParkingLot = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  base_price: number;
  [key: string]: unknown; 
};

type PopupContentProps = {
  lot: ParkingLot;
  userLocation: { latitude: number; longitude: number } | null;
};

// --- Helper component for info rows ---
function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType, 
  label: string, 
  value: string | number 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-semibold text-black">{value}</span>
    </div>
  );
}

export function PopupContent({ lot, userLocation }: PopupContentProps) {
  const [duration, setDuration] = useState<string | null>(null);

  // Run prediction using the full lot properties
  const prediction = getFakePrediction(lot.id);

  useEffect(() => {
    if (userLocation && lot.lng && lot.lat) {
      const fetchDirections = async () => {
        const userLng = Number(userLocation.longitude);
        const userLat = Number(userLocation.latitude);
        const lotLng = Number(lot.lng);
        const lotLat = Number(lot.lat);

        const coords = `${userLng},${userLat};${lotLng},${lotLat}`;
        const apiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY!;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${apiKey}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const routeDuration = data.routes[0].duration; // in seconds
            const durationInMinutes = Math.ceil(routeDuration / 60);
            setDuration(`${durationInMinutes} min drive`);
          }
        } catch (error) {
          console.error('Error fetching directions:', error);
          setDuration('N/A');
        }
      };

      fetchDirections();
    }
  }, [lot, userLocation]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}`;

  return (
    // We remove the inline style to let Mapbox's default popup style work,
    // but we use Tailwind classes for our content.
    <div className="p-1 font-sans text-black">
      {/* 1. Lot Name */}
      <h3 className="mb-2 text-lg font-bold text-gray-900">
        {lot.name || 'Parking Lot'}
      </h3>
      
      {/* 2. Info Section with Icons */}
      <div className="mb-3 space-y-2">
        <InfoRow 
          icon={BrainCircuit}
          label="Prediction"
          value={`${prediction.probability}% (${prediction.probability_text})`}
        />
        <InfoRow 
          icon={DollarSign}
          label="Est. Price"
          value={`Rs. ${prediction.price_pkr}/hr`}
        />
        <InfoRow 
          icon={Clock}
          label="Est. Time"
          value={duration || (userLocation ? 'Calculating...' : 'Enable location')}
        />
      </div>

      {/* 3. Divider */}
      <hr className="my-2" />

      {/* 4. Navigate Button with Icon */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center space-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <Navigation className="h-4 w-4" />
        <span>Navigate</span>
      </a>
    </div>
  );
}