import { useStore } from '../store';
import { AlarmCard } from './AlarmCard';
import { WeatherWidget } from './WeatherWidget';
import { useState } from 'react';
import type { Alarm } from '../lib/types';
import { AlarmModal } from './AlarmModal';

export const Dashboard = () => {
  const alarms = useStore((s) => s.alarms);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [creating, setCreating] = useState(false);

  const enabledCount = alarms.filter((a) => a.enabled).length;

  return (
    <main className="dashboard">
      <WeatherWidget />
      <div className="dashboard__head">
        <div>
          <h2 className="dashboard__title">Your alarms</h2>
          <p className="dashboard__sub">
            {alarms.length === 0
              ? 'No alarms yet — add one to get started.'
              : `${enabledCount} of ${alarms.length} active`}
          </p>
        </div>
        <button className="primary-btn" onClick={() => setCreating(true)}>
          + Add alarm
        </button>
      </div>

      {alarms.length === 0 ? (
        <EmptyState onAdd={() => setCreating(true)} />
      ) : (
        <ul className="alarm-list">
          {alarms
            .slice()
            .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
            .map((alarm) => (
              <li key={alarm.id}>
                <AlarmCard alarm={alarm} onEdit={setEditing} />
              </li>
            ))}
        </ul>
      )}

      {(creating || editing) && (
        <AlarmModal
          alarm={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </main>
  );
};

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="empty-state">
    <div className="empty-state__art" aria-hidden="true">🌅</div>
    <h3 className="empty-state__title">Wake up informed</h3>
    <p className="empty-state__sub">
      When your alarm fires, you'll hear the weather and today's top tech headlines.
    </p>
    <button className="primary-btn" onClick={onAdd}>
      Create your first alarm
    </button>
  </div>
);