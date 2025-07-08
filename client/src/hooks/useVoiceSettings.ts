import { useState, useEffect } from 'react';

export type VoiceTheme = 'default' | 'minimal' | 'professional' | 'neon' | 'glass';

interface VoiceSettings {
  theme: VoiceTheme;
  useModernComponents: boolean;
  autoTranscribe: boolean;
  reactionHistory: Record<number, { emoji: string; count: number; hasReacted: boolean }[]>;
}

const defaultSettings: VoiceSettings = {
  theme: 'default',
  useModernComponents: true,
  autoTranscribe: false,
  reactionHistory: {}
};

const STORAGE_KEY = 'communityhub-voice-settings';

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Falha ao salvar configurações de voz:', error);
    }
  }, [settings]);

  const updateTheme = (theme: VoiceTheme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const toggleModernComponents = () => {
    setSettings(prev => ({ ...prev, useModernComponents: !prev.useModernComponents }));
  };

  const toggleAutoTranscribe = () => {
    setSettings(prev => ({ ...prev, autoTranscribe: !prev.autoTranscribe }));
  };

  const addReaction = (messageId: number, emoji: string) => {
    setSettings(prev => {
      const currentReactions = prev.reactionHistory[messageId] || [];
      const existingReaction = currentReactions.find(r => r.emoji === emoji);
      
      const newReactions = existingReaction
        ? currentReactions.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
              : r
          ).filter(r => r.count > 0)
        : [...currentReactions, { emoji, count: 1, hasReacted: true }];

      return {
        ...prev,
        reactionHistory: {
          ...prev.reactionHistory,
          [messageId]: newReactions
        }
      };
    });
  };

  const getReactions = (messageId: number) => {
    return settings.reactionHistory[messageId] || [];
  };

  return {
    settings,
    updateTheme,
    toggleModernComponents,
    toggleAutoTranscribe,
    addReaction,
    getReactions
  };
}