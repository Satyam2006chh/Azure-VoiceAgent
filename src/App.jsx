import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/common/AuthModal';
import { AboutPage } from './pages/AboutPage';
import { AssistantPage } from './pages/AssistantPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { TechnologyPage } from './pages/TechnologyPage';
import { TeamPage } from './pages/TeamPage';
import { AdminPage } from './pages/AdminPage';

const AppRouter = () => {
  const { currentRoute } = useApp();

  // Admin page has its own full-screen layout (no Navbar/Footer)
  if (currentRoute === 'admin') {
    return <AdminPage />;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 60px - 260px)' }}>
      {currentRoute === 'about'        && <AboutPage />}
      {currentRoute === 'assistant'    && <AssistantPage />}
      {currentRoute === 'architecture' && <ArchitecturePage />}
      {currentRoute === 'technology'   && <TechnologyPage />}
      {currentRoute === 'team'         && <TeamPage />}
      {currentRoute === 'admin'        && <AdminPage />}
    </main>
  );
};

export function App() {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0A0E1A' }}>
        <Navbar />
        <AppRouter />
        <Footer />
        <AuthModal />
      </div>
    </AppProvider>
  );
}

export default App;
