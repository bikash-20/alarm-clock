import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alarm } from '../lib/types';
import { useStore } from '../store';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  alarm: Alarm | null;  // null = creating new
  onClose: () => void;
};

export const AlarmModal = ({ alarm, onClose }: Props) => {
  const addAlarm = useStore((s) => s.addAlarm);
  const updateAlarm = useStore((s) => s.updateAlarm);

  const [hour, setHour] = useState(alarm?.hour ?? 7);
  const [minute, setMinute] = useState(alarm?.minute ?? 0);
  const [label, setLabel] = useState(alarm?.label ?? '');
  const [days, setDays] = useState<number[]>(alarm?.days ?? [1, 2, 3, 4, 5]);
  const [oneTime, setOneTime] = useState(alarm?.oneTime ?? false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alarm) {
      updateAlarm(alarm.id, { hour, minute, label, days: oneTime ? [] : days, oneTime });
    } else {
      addAlarm({ hour, minute, label, days: oneTime ? [] : days, oneTime });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.form
          className="modal"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onSubmit={submit}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <h3 className="modal__title">{alarm ? 'Edit alarm' : 'New alarm'}</h3>

          <label className="field">
            <span className="field__label">Time</span>
            <input
              type="time"
              className="field__input"
              value={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (h !== undefined) setHour(h);
                if (m !== undefined) setMinute(m);
              }}
            />
          </label>

          <label className="field">
            <span className="field__label">Label</span>
            <input
              type="text"
              className="field__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Morning standup"
              maxLength={50}
            />
          </label>

          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={oneTime}
                onChange={(e) => setOneTime(e.target.checked)}
              />
              <span>One-time alarm (won't repeat)</span>
            </label>
          </div>

          {!oneTime && (
            <div className="field">
              <span className="field__label">Repeat</span>
              <div className="day-picker">
                {DAY_LABELS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    className={`day-btn ${days.includes(i) ? 'day-btn--on' : ''}`}
                    onClick={() => toggleDay(i)}
                    aria-pressed={days.includes(i)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal__actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {alarm ? 'Save' : 'Create'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
};