import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

// Bell-style install notification. Slides up from the bottom on first visit
// (once per session). Adapts to platform: Android/Desktop → native prompt,
// iOS → hint to use Share → Add to Home Screen.

export const InstallPrompt = () => {
  const { kind, accept, dismiss } = useInstallPrompt();
  const show = kind === 'available' || kind === 'ios';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install-prompt"
          role="status"
          aria-live="polite"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <div className="install-prompt__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              <path d="M12 2v3" />
              <path d="M19 5l-1.5 1.5" />
              <path d="M5 5l1.5 1.5" />
            </svg>
          </div>

          <div className="install-prompt__body">
            <p className="install-prompt__title">Install Briefing</p>
            <p className="install-prompt__sub">
              {kind === 'ios'
                ? 'Tap Share, then "Add to Home Screen" for a full app experience.'
                : 'Add to your home screen for one-tap alarms and offline briefings.'}
            </p>
          </div>

          <div className="install-prompt__actions">
            <button className="ghost-btn install-prompt__dismiss" onClick={dismiss}>
              Not now
            </button>
            {kind === 'available' && (
              <button className="primary-btn" onClick={accept}>
                Install
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};