import { useEffect, useState } from 'react';
import { type CityCluster } from '../../types';
import { PRIMARY_COLOR, BACKGROUND_COLOR } from '../../lib/constants';
import ProfileCard from './ProfileCard';

interface ProfileFanOutProps {
  cluster: CityCluster | null;
  onClose: () => void;
}

export default function ProfileFanOut({ cluster, onClose }: ProfileFanOutProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  // Reset count when cluster changes (setState-during-render pattern).
  const [prevCluster, setPrevCluster] = useState(cluster);
  if (prevCluster !== cluster) {
    setPrevCluster(cluster);
    setVisibleCount(0);
  }

  // Staggered fade-in: reveal one card every 50ms.
  useEffect(() => {
    if (!cluster) return;
    const total = cluster.people.length;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setVisibleCount(current);
      if (current >= total) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [cluster]);

  if (!cluster) return null;

  const { city, country, people } = cluster;
  const title = country && country !== city ? `${city}, ${country}` : city;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl border border-gray-200
                     flex flex-col overflow-hidden animate-scale-in"
          style={{ backgroundColor: BACKGROUND_COLOR }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {title}
              </h2>
              <p
                className="text-xs text-gray-500 mt-0.5"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                {people.length} {people.length === 1 ? 'person' : 'people'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full
                         hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
              {people.map((person, index) => (
                <div
                  key={person.id}
                  className="transition-all duration-300"
                  style={{
                    opacity: index < visibleCount ? 1 : 0,
                    transform: index < visibleCount ? 'translateY(0)' : 'translateY(12px)',
                  }}
                >
                  <ProfileCard
                    person={person}
                    clusterCity={cluster.city}
                    clusterCountry={cluster.country}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Crimson accent bar at bottom */}
          <div className="h-1 w-full" style={{ backgroundColor: PRIMARY_COLOR }} />
        </div>
      </div>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
}
