import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  GROUP_VALUES,
  GROUP_LABEL,
  GROUPING_ENABLED,
  UNCERTAINTY_ENABLED,
  UNCERTAINTY_LOCATION,
} from '../../lib/constants';
import { formatLocationFull, sameCity } from '../../lib/formatters';
import type { GroupValue, Person, Location } from '../../types';
import PhotoUpload from './PhotoUpload';
import LocationAutocomplete from './LocationAutocomplete';
import Dropdown from '../ui/Dropdown';
import EditModeSearch from './EditModeSearch';
import DuplicateDialog from './DuplicateDialog';
import SubmitSuccess from './SubmitSuccess';

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
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<Person | null>(null);

  const groupOptions = useMemo(
    () => GROUP_VALUES.map((v) => ({ value: v, label: `${GROUP_LABEL} ${v}` })),
    [],
  );

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

  const selectPersonForEdit = useCallback((person: Person) => {
    setEditingPerson(person);
    setName(person.name);
    setGroupValue(person.group_value ?? '');

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
    setError(null);
  }, []);

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

  if (success) {
    return (
      <SubmitSuccess
        isUpdate={!!editingPerson}
        onAnother={() => {
          setSuccess(false);
          setEditMode(false);
        }}
      />
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
              : "Tell us where you'll be."}
          </p>
        </div>

        {!editingPerson && (
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => setEditMode((m) => !m)}
              className="text-primary font-sans text-sm hover:underline"
            >
              {editMode ? 'New submission instead?' : 'Already submitted? Update your entry'}
            </button>
          </div>
        )}

        {editMode && !editingPerson && (
          <EditModeSearch onSelect={selectPersonForEdit} />
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
              value={uncertainLocation ? UNCERTAINTY_LOCATION.city : formatLocationFull(primaryLocation)}
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
                  value={formatLocationFull(secondaryLocation)}
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
        <DuplicateDialog
          match={duplicateMatch}
          submitting={submitting}
          onUpdate={handleDuplicateUpdate}
          onSubmitAsNew={handleDuplicateSubmitAsNew}
          onCancel={() => setDuplicateMatch(null)}
        />
      )}
    </div>
  );
}
