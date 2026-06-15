import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import RoomManagement from './pages/RoomManagement';
import Blacklist from './pages/Blacklist';
import Logs from './pages/Logs';
import Export from './pages/Export';
import Verification from './pages/Verification';
import useStore from './store/useStore';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const { initData } = useStore();

  useEffect(() => {
    initData();
  }, [initData]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'rooms':
        return <RoomManagement />;
      case 'blacklist':
        return <Blacklist />;
      case 'logs':
        return <Logs />;
      case 'export':
        return <Export />;
      case 'verification':
        return <Verification />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 p-6">
        {renderPage()}
      </main>
    </div>
  );
}
