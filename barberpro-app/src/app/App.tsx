import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Barbers } from './pages/Barbers';
import { Services } from './pages/Services';
import { Clients } from './pages/Clients';
import { Checkout } from './pages/Checkout';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <Calendar />;
      case 'barbers': return <Barbers />;
      case 'services': return <Services />;
      case 'clients': return <Clients />;
      case 'checkout': return <Checkout />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}