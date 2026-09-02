import { useCallback, useEffect, useRef } from 'react';
import type { Briefing } from '../lib/types';

// Web Speech API wrapper. Loads voices once (Chrome returns empty array on first
// call) and reuses the resolved promise. Handles speechSynthesis quirks:
// cancel() before speak() to drop any queued utterance, re-armed on visibility.

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial.length > 0) {
      resolve(initial);
      return;
    }
    const handler = () => {
      synth.removeEventListener('voiceschanged', handler);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', handler);
    // Some browsers never fire voiceschanged — set a hard timeout.
    setTimeout(() => resolve(synth.getVoices()), 1500);
  });
  return voicesPromise;
};

const pickVoice = (
  voices: SpeechSynthesisVoice[],
  preferred: string | null,
): SpeechSynthesisVoice | undefined => {
  if (preferred) {
    const match = voices.find((v) => v.name === preferred);
    if (match) return match;
  }
  return (
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0]
  );
};

export const useTTS = () => {
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(async (briefing: Briefing, city: string): Promise<void> => {
    if (!('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const voices = await loadVoices();
    if (cancelled.current) return;

    const preferredName = localStorage.getItem('alarm-clock:v1:voiceName');
    const voice = pickVoice(voices, preferredName);

    const script = [
      `Good morning. This is your executive briefing.`,
      `The weather in ${city} is ${briefing.weather.temperature} degrees and ${briefing.weather.condition.toLowerCase()}.`,
      `Here are today's top tech headlines.`,
      ...briefing.headlines.map((h, i) => `Number ${i + 1}. ${h}.`),
      `That concludes your briefing. Have a productive day.`,
    ].join(' ');

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(script);
      if (voice) utterance.voice = voice;
      utterance.rate = Number(localStorage.getItem('alarm-clock:v1:ttsRate') ?? '1');
      utterance.pitch = 1;
      utterance.volume = 1;

      const finish = () => {
        synth.removeEventListener('voiceschanged', finish);
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      // Chrome bug: long utterances stop at ~15s. Resume on boundary.
      const resumeInterval = window.setInterval(() => {
        if (synth.speaking && !synth.paused) synth.pause();
        if (synth.paused) synth.resume();
      }, 10_000);
      utterance.onend = () => {
        window.clearInterval(resumeInterval);
        finish();
      };

      synth.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
};