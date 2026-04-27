import { useMemo } from 'react';
import { GROUP_VALUES, GROUP_LABEL } from '../../lib/constants';
import type { GroupValue } from '../../types';
import Dropdown from '../ui/Dropdown';

interface GroupFilterProps {
  value: GroupValue | null;
  onChange: (value: GroupValue | null) => void;
}

const MAP_TRIGGER =
  "flex items-center justify-between gap-2 min-w-[9.5rem] px-4 py-2 rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm text-sm font-medium font-['DM_Sans',sans-serif] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow cursor-pointer";

export default function GroupFilter({ value, onChange }: GroupFilterProps) {
  const allLabel = `All ${GROUP_LABEL}s`;
  const options = useMemo(
    () => [
      { value: '', label: allLabel },
      ...GROUP_VALUES.map((v) => ({ value: v, label: `${GROUP_LABEL} ${v}` })),
    ],
    [allLabel],
  );

  return (
    <div className="pointer-events-auto absolute top-4 right-6 z-10">
      <Dropdown
        value={value ?? ''}
        onChange={(v) => onChange(v === '' ? null : v)}
        options={options}
        placeholder={allLabel}
        triggerClassName={MAP_TRIGGER}
        menuAlign="right"
        ariaLabel={`Filter pins by ${GROUP_LABEL.toLowerCase()}`}
      />
    </div>
  );
}
