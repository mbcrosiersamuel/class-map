import { useState, useRef, useEffect } from 'react';
import { PRIMARY_COLOR } from '../../lib/constants';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  triggerClassName?: string;
  menuAlign?: 'left' | 'right' | 'stretch';
  ariaLabel?: string;
}

const DEFAULT_TRIGGER =
  "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-['DM_Sans',sans-serif] shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer";

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select',
  triggerClassName,
  menuAlign = 'stretch',
  ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const currentLabel = selectedOption?.label ?? placeholder;
  const hasSelection = !!selectedOption && selectedOption.value !== '';

  const menuPosition =
    menuAlign === 'left'
      ? 'left-0'
      : menuAlign === 'right'
        ? 'right-0'
        : 'left-0 right-0';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName ?? DEFAULT_TRIGGER}
        style={{ color: hasSelection ? PRIMARY_COLOR : '#374151' }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute ${menuPosition} mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto min-w-[10rem]`}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <li
                key={opt.value || '__none__'}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-['DM_Sans',sans-serif] hover:bg-surface cursor-pointer"
                style={{
                  color: selected ? PRIMARY_COLOR : '#374151',
                  fontWeight: selected ? 500 : 400,
                }}
              >
                <span className="truncate">{opt.label}</span>
                {selected && (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    fill="none"
                    stroke={PRIMARY_COLOR}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
