import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './LandingPage';
import EditorPage from './EditorPage';
import Dashboard from './Dashboard';
import Pricing from './Pricing';

function App() {
  const [page, setPage] = useState('landing'); // 'landing', 'editor', 'dashboard', or 'pricing'
  const [qrCodeToEdit, setQrCodeToEdit] = useState(null); // Store QR code data for editing

  if (page === 'landing') {
    return (
      <AuthProvider>
        <LandingPage 
          onViewDashboard={() => setPage('dashboard')}
          onViewPricing={() => setPage('pricing')}
          qrCodeToEdit={qrCodeToEdit}
          onClearQrCodeToEdit={() => setQrCodeToEdit(null)}
        />
      </AuthProvider>
    );
  }

  if (page === 'dashboard') {
    return (
      <AuthProvider>
        <Dashboard 
          onCreate={() => setPage('landing')}
          onViewPricing={() => setPage('pricing')}
          onBack={() => setPage('landing')}
          onEditQrCode={(qrCode) => {
            setQrCodeToEdit(qrCode);
            setPage('landing');
          }}
        />
      </AuthProvider>
    );
  }

  if (page === 'pricing') {
    return (
      <AuthProvider>
        <Pricing onViewDashboard={() => setPage('dashboard')} onBack={() => setPage('landing')} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <EditorPage onBack={() => setPage('landing')} onGoToDashboard={() => setPage('dashboard')} onGoToProfile={() => console.log('Profile clicked')} />
    </AuthProvider>
  );
}

export default App;
