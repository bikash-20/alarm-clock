import { useStore } from '../store';
import { useNextAlarm } from '../hooks/useNextAlarm';

export const Header = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const theme = useStore((s) => s.settings.theme);
  const updateSettings = useStore((s) => s.updateSettings);
  const next = useNextAlarm();

  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">⏰</span>
        <div>
          <h1 className="app-header__title">Briefing</h1>
          <p className="app-header__sub">
            {next
              ? `Next: ${next.label} in ${next.countdown}`
              : 'No alarms scheduled'}
          </p>
        </div>
      </div>
      <div className="app-header__actions">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
};