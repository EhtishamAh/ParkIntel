// This imports the map component we will create next
import MainMap from '@/components/map/MainMap';

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-57px)] w-full">
      {/* The h-[calc(100vh-57px)] calculates the full viewport height 
        minus the 57px height of our sticky header.
      */}
      <MainMap />
    </div>
  );
}