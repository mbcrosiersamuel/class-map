import { PRIMARY_COLOR } from '../../lib/constants';

interface CityMarkerProps {
  count: number;
  onClick: () => void;
}

export default function CityMarker({ count, onClick }: CityMarkerProps) {
  // Scale marker size based on number of people
  let sizeClass: string;
  let textClass: string;

  if (count <= 3) {
    sizeClass = 'w-10 h-10';
    textClass = 'text-xs';
  } else if (count <= 10) {
    sizeClass = 'w-11 h-11';
    textClass = 'text-sm';
  } else {
    sizeClass = 'w-12 h-12';
    textClass = 'text-sm font-bold';
  }

  return (
    <button
      onClick={onClick}
      className={`${sizeClass} rounded-full flex items-center justify-center
                  text-white font-semibold ${textClass}
                  shadow-md hover:shadow-lg
                  transition-all duration-200 hover:scale-110
                  cursor-pointer border-2 border-white/80`}
      style={{
        backgroundColor: PRIMARY_COLOR,
        fontFamily: '"DM Sans", sans-serif',
      }}
      aria-label={`${count} ${count === 1 ? 'person' : 'people'} in this city`}
    >
      {count}
    </button>
  );
}
