import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { type Person, type GroupValue, type CityCluster } from '../../types';
import { DEFAULT_CENTER, DEFAULT_ZOOM, GROUPING_ENABLED, BACKGROUND_COLOR } from '../../lib/constants';
import { getCityCountryKey } from '../../lib/formatters';
import GroupFilter from './GroupFilter';
import MapSearchBar from './MapSearchBar';
import CityMarker from './CityMarker';
import ProfileFanOut from './ProfileFanOut';

interface MapViewProps {
  people: Person[];
  homeNonce?: number;
}

function isValidCoord(lat: number, lng: number): boolean {
  return lat !== 0 || lng !== 0;
}

// A person with two cities contributes to two clusters.
function clusterPeople(people: Person[]): CityCluster[] {
  const groups = new window.Map<string, CityCluster>();

  for (const person of people) {
    for (const loc of person.locations) {
      if (!isValidCoord(loc.latitude, loc.longitude)) continue;
      const key = getCityCountryKey(loc.city, loc.country);
      if (groups.has(key)) {
        groups.get(key)!.people.push(person);
      } else {
        groups.set(key, {
          city: loc.city,
          country: loc.country,
          latitude: loc.latitude,
          longitude: loc.longitude,
          people: [person],
        });
      }
    }
  }

  return Array.from(groups.values());
}

export default function MapView({ people, homeNonce }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedCluster, setSelectedCluster] = useState<CityCluster | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupValue | null>(null);

  const filteredPeople = useMemo(() => {
    if (!groupFilter) return people;
    return people.filter((p) => p.group_value === groupFilter);
  }, [people, groupFilter]);

  const clusters = useMemo(() => clusterPeople(filteredPeople), [filteredPeople]);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 8,
      duration: 2000,
      essential: true,
    });
  }, []);

  const handleMarkerClick = useCallback((cluster: CityCluster) => {
    setSelectedCluster(cluster);

    mapRef.current?.flyTo({
      center: [cluster.longitude, cluster.latitude],
      zoom: 6,
      duration: 1500,
      essential: true,
    });
  }, []);

  const handleCloseFanOut = useCallback(() => {
    setSelectedCluster(null);
  }, []);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.setFog({
      color: BACKGROUND_COLOR,
      'high-color': BACKGROUND_COLOR,
      'horizon-blend': 0.1,
      'space-color': BACKGROUND_COLOR,
      'star-intensity': 0,
    });
  }, []);

  // When the header title is clicked, fly back to the default view
  // and close any open profile modal. `homeNonce` bumps each time so this
  // effect re-runs even when the user clicks "home" while already at home.
  useEffect(() => {
    if (homeNonce === undefined || homeNonce === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the modal in response to a parent trigger is the intended behavior
    setSelectedCluster(null);
    mapRef.current?.flyTo({
      center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
      zoom: DEFAULT_ZOOM,
      duration: 1500,
      essential: true,
    });
  }, [homeNonce]);

  return (
    <div className="relative w-full h-full bg-surface">
      <Map
        ref={mapRef}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          latitude: DEFAULT_CENTER.latitude,
          longitude: DEFAULT_CENTER.longitude,
          zoom: DEFAULT_ZOOM,
        }}
        projection={{ name: 'globe' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        onLoad={handleMapLoad}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {clusters.map((cluster) => {
          const key = `${cluster.city}-${cluster.country}-${cluster.latitude}-${cluster.longitude}`;
          return (
            <Marker
              key={key}
              latitude={cluster.latitude}
              longitude={cluster.longitude}
              anchor="center"
            >
              <CityMarker
                count={cluster.people.length}
                onClick={() => handleMarkerClick(cluster)}
              />
            </Marker>
          );
        })}
      </Map>

      <div className="pointer-events-none absolute inset-0">
        <div className="relative max-w-7xl mx-auto h-full">
          <MapSearchBar onFlyTo={handleFlyTo} />
          {GROUPING_ENABLED && <GroupFilter value={groupFilter} onChange={setGroupFilter} />}
        </div>
      </div>

      {clusters.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 md:bottom-12 flex justify-center px-4">
          <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100 px-5 py-4 max-w-sm text-center">
            <p className="font-display text-base text-gray-900 mb-1">
              No pins yet
            </p>
            <p className="text-sm text-gray-500 font-sans">
              {groupFilter
                ? 'No one in this group has dropped a pin yet.'
                : 'Be the first to drop a pin — head to the Submit tab.'}
            </p>
          </div>
        </div>
      )}

      <ProfileFanOut cluster={selectedCluster} onClose={handleCloseFanOut} />
    </div>
  );
}
