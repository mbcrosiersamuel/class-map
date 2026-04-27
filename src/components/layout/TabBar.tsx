import type { TabView } from '../../types';

interface TabBarProps {
  active: TabView;
  onChange: (tab: TabView) => void;
}

const tabs: { key: TabView; label: string; icon: string }[] = [
  { key: 'map', label: 'Map', icon: '🌍' },
  { key: 'submit', label: 'Submit', icon: '✏️' },
  { key: 'list', label: 'List', icon: '📋' },
  { key: 'stats', label: 'Stats', icon: '📊' },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <>
      {/* Desktop: top tabs */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`px-5 py-3 text-sm font-sans font-medium transition-colors relative ${
                active === tab.key
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {active === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile: bottom fixed tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-sans font-medium transition-colors ${
              active === tab.key
                ? 'text-primary'
                : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}
