import { type Person, type Location } from '../../types';
import {
  PRIMARY_COLOR,
  BACKGROUND_COLOR,
  GROUP_LABEL,
  GROUPING_ENABLED,
  UNCERTAINTY_ENABLED,
  UNCERTAINTY_LOCATION,
} from '../../lib/constants';

interface ProfileCardProps {
  person: Person;
  /** City of the cluster this card is rendered in. Used to label the "also in" other city. */
  clusterCity?: string;
  clusterCountry?: string;
  style?: React.CSSProperties;
}

function matchesCluster(loc: Location, city?: string, country?: string): boolean {
  if (!city) return false;
  if (loc.city.toLowerCase() !== city.toLowerCase()) return false;
  if (country && loc.country.toLowerCase() !== country.toLowerCase()) return false;
  return true;
}

export default function ProfileCard({ person, clusterCity, clusterCountry, style }: ProfileCardProps) {
  // The location shown as "primary" on the card should be the one matching the
  // current cluster (when rendered inside a fan-out). Fall back to locations[0].
  const current: Location | undefined =
    person.locations.find((l) => matchesCluster(l, clusterCity, clusterCountry)) ??
    person.locations[0];
  const other: Location | null =
    person.locations.length > 1
      ? person.locations.find((l) => l !== current) ?? null
      : null;
  const isUncertain = UNCERTAINTY_ENABLED && current?.city === UNCERTAINTY_LOCATION.city;
  const showGroup = GROUPING_ENABLED && person.group_value;

  if (person.photo_url) {
    return (
      <div
        className="relative w-28 h-36 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
        style={style}
      >
        {isUncertain && (
          <div className="absolute top-0.5 left-0.5 z-20 flex items-center gap-0.5 text-sm drop-shadow-sm">
            <span>🌺</span>
            <span>🌸</span>
          </div>
        )}
        <img
          src={person.photo_url}
          alt={person.name}
          width={112}
          height={144}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {showGroup && (
          <span
            className="absolute top-1.5 right-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {person.group_value}
          </span>
        )}
        <div
          className="absolute inset-x-0 bottom-0 px-2 pt-6 pb-1.5"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)',
          }}
        >
          <p
            className="text-[11px] font-semibold text-white text-center leading-tight drop-shadow"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            {person.name}
          </p>
          {other && (
            <p
              className="text-[9px] text-white/85 text-center leading-tight mt-0.5 drop-shadow"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              also in {other.city}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-28 h-36 flex flex-col items-center justify-center rounded-xl border border-gray-200 shadow-sm p-3 gap-1.5"
      style={{ backgroundColor: BACKGROUND_COLOR, ...style }}
    >
      {isUncertain && (
        <>
          <span className="absolute top-0.5 left-0.5 text-sm drop-shadow-sm">🌺</span>
          <span className="absolute top-0.5 right-0.5 text-sm drop-shadow-sm">🌸</span>
        </>
      )}
      <p
        className="text-xs font-semibold text-gray-800 text-center leading-tight"
        style={{ fontFamily: '"DM Sans", sans-serif' }}
      >
        {person.name}
      </p>
      {showGroup && (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {GROUP_LABEL} {person.group_value}
        </span>
      )}
      {current?.city && (
        <p
          className="text-[10px] text-gray-500 text-center leading-tight"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          {current.city}
          {current.country && current.country !== current.city ? `, ${current.country}` : ''}
        </p>
      )}
      {other && (
        <p
          className="text-[10px] text-gray-400 text-center leading-tight italic"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          also in {other.city}
        </p>
      )}
    </div>
  );
}
