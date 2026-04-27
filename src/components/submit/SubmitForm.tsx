import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  GROUP_VALUES,
  GROUP_LABEL,
  GROUPING_ENABLED,
  UNCERTAINTY_ENABLED,
  UNCERTAINTY_LOCATION,
} from '../../lib/constants';
import type { GroupValue, Person, Location } from '../../types';
import PhotoUpload from './PhotoUpload';
import LocationAutocomplete from './LocationAutocomplete';
import Dropdown from '../ui/Dropdown';

// Shape the LocationAutocomplete emits (no zip).
interface GeocodedLocation {
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

function toLocation(g: GeocodedLocation): Location {
  return { ...g, zip: null };
}

function locationDisplay(loc: Location | null): string {
  if (!loc) return '';
  return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
}

function sameCity(a: Location, b: Location): boolean {
  return (
    a.city.toLowerCase() === b.city.toLowerCase() &&
    a.country.toLowerCase() === b.country.toLowerCase()
  );
}

const UNCERTAIN_AS_LOCATION: Location = {
  city: UNCERTAINTY_LOCATION.city,
  state: UNCERTAINTY_LOCATION.state,
  country: UNCERTAINTY_LOCATION.country,
  zip: null,
  latitude: UNCERTAINTY_LOCATION.latitude,
  longitude: UNCERTAINTY_LOCATION.longitude,
};

export default function SubmitForm({ onSuccess }: { onSuccess?: () => void }) {
  // Form fields
  const [name, setName] = useState('');
  const [groupValue, setGroupValue] = useState<GroupValue | ''>('');
  const [primaryLocation, setPrimaryLocation] = useState<Location | null>(null);
  const [secondaryLocation, setSecondaryLocation] = useState<Location | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [uncertainLocation, setUncertainLocation] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<Person | null>(null);

  const groupOptions = useMemo(
    () => GROUP_VALUES.map((v) => ({ value: v, label: `${GROUP_LABEL} ${v}` })),
    [],
  );

  // "I don't know yet" puts them on the Island of Uncertainty (single-location only).
  const handleUncertainToggle = useCallback((checked: boolean) => {
    setUncertainLocation(checked);
    if (checked) {
      setPrimaryLocation(UNCERTAIN_AS_LOCATION);
      setSecondaryLocation(null);
      setShowSecondary(false);
    } else {
      setPrimaryLocation(null);
    }
  }, []);

  // Debounced name search for edit mode. All setState happens inside the
  // setTimeout callback so it never fires synchronously in the effect body.
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    const delay = !editMode || searchQuery.length < 2 ? 0 : 300;
    searchTimerRef.current = setTimeout(async () => {
      if (!editMode || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
      if (data) {
        setSearchResults(data as Person[]);
        setSearchOpen(true);
      }
    }, delay);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, editMode]);

  // Pre-fill form when a person is selected in edit mode
  const selectPersonForEdit = useCallback((person: Person) => {
    setEditingPerson(person);
    setName(person.name);
    setGroupValue(person.group_value ?? '');
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);

    const primary = person.locations[0] ?? null;
    const secondary = person.locations[1] ?? null;
    const isUncertain = UNCERTAINTY_ENABLED && primary?.city === UNCERTAINTY_LOCATION.city;

    setUncertainLocation(isUncertain);
    setPrimaryLocation(primary);
    setSecondaryLocation(secondary);
    setShowSecondary(!!secondary);
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setGroupValue('');
    setPrimaryLocation(null);
    setSecondaryLocation(null);
    setShowSecondary(false);
    setPhoto(null);
    setUncertainLocation(false);
    setEditingPerson(null);
    setSearchQuery('');
    setError(null);
  }, []);

  // Write to Supabase (insert or update).
  const persistEntry = useCallback(async () => {
    if (!primaryLocation) return;
    if (GROUPING_ENABLED && !groupValue) return;
    setSubmitting(true);
    try {
      let photoUrl: string | null = editingPerson?.photo_url || null;

      if (photo) {
        const fileName = `${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photo, {
            contentType: 'image/jpeg',
            upsert: false,
          });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const locations: Location[] = [primaryLocation];
      if (
        showSecondary &&
        secondaryLocation &&
        !sameCity(primaryLocation, secondaryLocation)
      ) {
        locations.push(secondaryLocation);
      }

      const row = {
        name: name.trim(),
        group_value: GROUPING_ENABLED ? groupValue : null,
        locations,
        photo_url: photoUrl,
      };

      if (editingPerson) {
        const { error: updateError } = await supabase
          .from('people')
          .update(row)
          .eq('id', editingPerson.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('people').insert([row]);
        if (insertError) throw insertError;
      }

      setSuccess(true);
      resetForm();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [editingPerson, primaryLocation, secondaryLocation, showSecondary, name, photo, groupValue, onSuccess, resetForm]);

  // Submit: validate, check for name duplicates (new submissions only), then write.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (GROUPING_ENABLED && !groupValue) {
      setError(`Please select your ${GROUP_LABEL.toLowerCase()}.`);
      return;
    }
    if (!primaryLocation) {
      setError(
        UNCERTAINTY_ENABLED
          ? 'Please select a location or check "I don\'t know yet".'
          : 'Please select a location.',
      );
      return;
    }
    if (showSecondary && !secondaryLocation) {
      setError('Please select your second city or uncheck "I\'ll be in a second city too".');
      return;
    }
    if (
      showSecondary &&
      secondaryLocation &&
      sameCity(primaryLocation, secondaryLocation)
    ) {
      setError('Your second city should be different from your first.');
      return;
    }

    if (!editingPerson) {
      setSubmitting(true);
      const { data: matches, error: lookupError } = await supabase
        .from('people')
        .select('*')
        .ilike('name', name.trim())
        .limit(1);
      setSubmitting(false);
      if (lookupError) {
        setError(lookupError.message || 'Could not check for duplicates.');
        return;
      }
      if (matches && matches.length > 0) {
        setDuplicateMatch(matches[0] as Person);
        return;
      }
    }

    await persistEntry();
  };

  const handleDuplicateUpdate = useCallback(() => {
    if (!duplicateMatch) return;
    selectPersonForEdit(duplicateMatch);
    setEditMode(true);
    setDuplicateMatch(null);
  }, [duplicateMatch, selectPersonForEdit]);

  const handleDuplicateSubmitAsNew = useCallback(async () => {
    setDuplicateMatch(null);
    await persistEntry();
  }, [persistEntry]);

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateMatch(null);
  }, []);

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-gray-900 mb-2">
            {editingPerson ? 'Entry Updated!' : 'You\'re on the Map!'}
          </h2>
          <p className="text-gray-500 font-sans text-sm mb-6">
            {editingPerson
              ? 'Your information has been updated successfully.'
              : 'Your pin has been placed. Check out the map to see where everyone is headed.'}
          </p>
          <button
            onClick={() => { setSuccess(false); setEditMode(false); }}
            className="px-6 py-2 bg-primary text-white font-sans text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl text-gray-900 mb-1">
            {editingPerson ? 'Update Your Pin' : 'Drop Your Pin'}
          </h2>
          <p className="text-gray-500 font-sans text-sm">
            {editingPerson
              ? `Editing entry for ${editingPerson.name}`
              : 'Tell us where you\'ll be.'}
          </p>
        </div>

        {!editingPerson && (
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => {
                setEditMode(!editMode);
                if (editMode) {
                  setSearchQuery('');
                  setSearchResults([]);
                }
              }}
              className="text-primary font-sans text-sm hover:underline"
            >
              {editMode ? 'New submission instead?' : 'Already submitted? Update your entry'}
            </button>
          </div>
        )}

        {editMode && !editingPerson && (
          <div className="relative mb-6">
            <label className="block text-sm font-sans font-medium text-gray-700 mb-1">
              Search your name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder="Type your name to find your entry..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchOpen && searchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((person) => (
                  <li
                    key={person.id}
                    onMouseDown={() => selectPersonForEdit(person)}
                    className="px-3 py-2 text-sm font-sans hover:bg-surface cursor-pointer"
                  >
                    <span className="font-medium">{person.name}</span>
                    {GROUPING_ENABLED && person.group_value && (
                      <span className="text-gray-400 ml-2">
                        {GROUP_LABEL} {person.group_value}
                      </span>
                    )}
                    {person.locations[0]?.city && (
                      <span className="text-gray-400 ml-1">· {person.locations[0].city}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 font-sans mt-1">
                No matching entries found. Try a different spelling or submit a new entry.
              </p>
            )}
          </div>
        )}

        {(!editMode || editingPerson) && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center">
              <PhotoUpload
                onPhotoSelect={setPhoto}
                existingUrl={editingPerson?.photo_url}
              />
            </div>

            <div>
              <label className="block text-sm font-sans font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Last"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {GROUPING_ENABLED && (
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 mb-1">
                  {GROUP_LABEL}
                </label>
                <Dropdown
                  value={groupValue}
                  onChange={(v) => setGroupValue(v)}
                  options={groupOptions}
                  placeholder={`Select your ${GROUP_LABEL.toLowerCase()}`}
                  ariaLabel={GROUP_LABEL}
                />
              </div>
            )}

            <LocationAutocomplete
              label={showSecondary ? 'First Location' : 'Location'}
              onSelect={(loc) => setPrimaryLocation(toLocation(loc))}
              disabled={uncertainLocation}
              value={uncertainLocation ? UNCERTAINTY_LOCATION.city : locationDisplay(primaryLocation)}
            />

            {UNCERTAINTY_ENABLED && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uncertainLocation}
                    onChange={(e) => handleUncertainToggle(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm font-sans text-gray-600">
                    I don't know yet
                  </span>
                </label>
                {uncertainLocation && (
                  <p className="text-xs text-gray-400 font-sans -mt-3 ml-6">
                    You'll be placed on the {UNCERTAINTY_LOCATION.city} in the {UNCERTAINTY_LOCATION.country}. Update anytime!
                  </p>
                )}
              </>
            )}

            {!uncertainLocation && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSecondary}
                  onChange={(e) => {
                    setShowSecondary(e.target.checked);
                    if (!e.target.checked) setSecondaryLocation(null);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-sans text-gray-600">
                  I'll be in a second city too
                </span>
              </label>
            )}

            {!uncertainLocation && showSecondary && (
              <div className="space-y-2">
                <LocationAutocomplete
                  label="Second Location"
                  placeholder="Start typing your second city..."
                  onSelect={(loc) => setSecondaryLocation(toLocation(loc))}
                  value={locationDisplay(secondaryLocation)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondary(false);
                    setSecondaryLocation(null);
                  }}
                  className="text-xs font-sans text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Remove second location
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-sans">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : editingPerson
                  ? 'Update My Pin'
                  : 'Drop My Pin'}
            </button>

            {editingPerson && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditMode(false);
                }}
                className="w-full py-2 text-gray-500 font-sans text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        )}
      </div>

      {duplicateMatch && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={handleDuplicateCancel}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-gray-900 mb-2">
              Already on the map
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              There's already a{' '}
              <span className="font-medium text-gray-900">{duplicateMatch.name}</span> on the map.
              {' '}Update their entry instead — you can add a second city there.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDuplicateUpdate}
                className="w-full py-2.5 bg-primary text-white font-sans text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Update their entry
              </button>
              <button
                type="button"
                onClick={handleDuplicateSubmitAsNew}
                disabled={submitting}
                className="w-full py-2.5 border border-gray-300 text-gray-700 font-sans text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit as new'}
              </button>
              <button
                type="button"
                onClick={handleDuplicateCancel}
                className="w-full py-2 text-gray-500 font-sans text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
