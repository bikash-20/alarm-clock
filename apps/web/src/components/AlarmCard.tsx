import type { Alarm } from '../lib/types';
import { format12h, formatDays } from '../lib/time';
import { useStore } from '../store';

export const AlarmCard = ({
  alarm,
  onEdit,
}: {
  alarm: Alarm;
  onEdit: (alarm: Alarm) => void;
}) => {
  const toggleAlarm = useStore((s) => s.toggleAlarm);
  const deleteAlarm = useStore((s) => s.deleteAlarm);

  return (
    <article className={`alarm-card ${alarm.enabled ? '' : 'alarm-card--off'}`}>
      <div className="alarm-card__time">
        <span className="alarm-card__hour">{format12h(alarm.hour, alarm.minute)}</span>
        <span className="alarm-card__days">{formatDays(alarm.days)}</span>
      </div>

      <div className="alarm-card__body">
        <p className="alarm-card__label">{alarm.label || 'Untitled alarm'}</p>
        {alarm.snoozeUntil && Date.parse(alarm.snoozeUntil) > Date.now() && (
          <p className="alarm-card__snooze">Snoozed</p>
        )}
      </div>

      <div className="alarm-card__actions">
        <button
          className="toggle"
          role="switch"
          aria-checked={alarm.enabled}
          onClick={() => toggleAlarm(alarm.id)}
        >
          <span className="toggle__track">
            <span className="toggle__thumb" />
          </span>
        </button>
        <button
          className="icon-btn"
          onClick={() => onEdit(alarm)}
          aria-label={`Edit ${alarm.label || 'alarm'}`}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="icon-btn icon-btn--danger"
          onClick={() => {
            if (confirm(`Delete "${alarm.label || 'alarm'}"?`)) deleteAlarm(alarm.id);
          }}
          aria-label={`Delete ${alarm.label || 'alarm'}`}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </article>
  );
};