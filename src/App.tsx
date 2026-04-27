import { useState, useEffect, useCallback } from 'react';
import type { TabView } from './types';
import { usePeople } from './hooks/usePeople';
import Header from './components/layout/Header';
import TabBar from './components/layout/TabBar';
import MapView from './components/map/MapView';
import SubmitForm from './components/submit/SubmitForm';
import ListView from './components/list/ListView';
import StatsView from './components/stats/StatsView';

const VALID_TABS: readonly TabView[] = ['map', 'submit', 'list', 'stats'];

function tabFromHash(hash: string): TabView {
  const clean = hash.replace(/^#/, '').toLowerCase();
  return (VALID_TABS as readonly string[]).includes(clean) ? (clean as TabView) : 'map';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>(() =>
    typeof window !== 'undefined' ? tabFromHash(window.location.hash) : 'map',
  );
  const [mapHomeNonce, setMapHomeNonce] = useState(0);
  const { people, loading, refetch } = usePeople();

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = useCallback((tab: TabView) => {
    setActiveTab(tab);
    const target = tab === 'map' ? ' ' : `#${tab}`;
    if (tab === 'map') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else if (window.location.hash !== target) {
      history.replaceState(null, '', target);
    }
  }, []);

  const handleHomeClick = useCallback(() => {
    handleTabChange('map');
    setMapHomeNonce((n) => n + 1);
  }, [handleTabChange]);

  return (
    <div className="h-full flex flex-col bg-surface">
      <Header onHomeClick={handleHomeClick} />
      <TabBar active={activeTab} onChange={handleTabChange} />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'map' && (
          <MapView people={people} homeNonce={mapHomeNonce} />
        )}
        {activeTab === 'submit' && (
          <div className="h-full overflow-y-auto pb-20 md:pb-0">
            <SubmitForm onSuccess={refetch} />
          </div>
        )}
        {activeTab === 'list' && (
          <div className="h-full overflow-y-auto pb-20 md:pb-0">
            <ListView people={people} loading={loading} />
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="h-full overflow-y-auto pb-20 md:pb-0">
            <StatsView people={people} />
          </div>
        )}
      </main>
    </div>
  );
}
