import { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BriefingOverlay } from './components/BriefingOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { InstallPrompt } from './components/InstallPrompt';
import { useTheme } from './hooks/useTheme';
import { useAlarmChecker } from './hooks/useAlarmChecker';

export const App = () => {
  useTheme();
  useAlarmChecker();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <Dashboard />
      <BriefingOverlay />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstallPrompt />
    </div>
  );
};