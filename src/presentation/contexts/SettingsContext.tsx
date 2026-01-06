// Presentation Context - Settings Context
// Manages church settings across the application

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface ChurchSettings {
  churchName: string;
  churchTagline: string;
  churchAddress: string;
  churchPhone: string;
  churchEmail: string;
  churchWebsite: string;
  logoURL?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  language: string;
}

interface SettingsContextType {
  settings: ChurchSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<ChurchSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const defaultSettings: ChurchSettings = {
  churchName: 'Igreja Conectados pela Fé',
  churchTagline: 'Conectados pela fé',
  churchAddress: '',
  churchPhone: '',
  churchEmail: '',
  churchWebsite: '',
  logoURL: undefined,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR'
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ChurchSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // Update CSS variables when settings change
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', settings.primaryColor);
      root.style.setProperty('--color-secondary', settings.secondaryColor);
      
      // Also update darker variants for hover states
      const primaryRgb = hexToRgb(settings.primaryColor);
      const secondaryRgb = hexToRgb(settings.secondaryColor);
      
      if (primaryRgb) {
        const darkerPrimary = `rgb(${Math.max(0, primaryRgb.r - 30)}, ${Math.max(0, primaryRgb.g - 30)}, ${Math.max(0, primaryRgb.b - 30)})`;
        root.style.setProperty('--color-primary-dark', darkerPrimary);
      }
      
      if (secondaryRgb) {
        const darkerSecondary = `rgb(${Math.max(0, secondaryRgb.r - 30)}, ${Math.max(0, secondaryRgb.g - 30)}, ${Math.max(0, secondaryRgb.b - 30)})`;
        root.style.setProperty('--color-secondary-dark', darkerSecondary);
      }
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'church');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ChurchSettings;
        setSettings({ ...defaultSettings, ...data });
      } else {
        // Try to create default settings if user has permission
        try {
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
        } catch (createError) {
          // If can't create, just use defaults
          console.warn('Cannot create settings document, using defaults:', createError);
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.warn('Error loading settings, using defaults:', error);
      // Fallback to default settings on error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ChurchSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      const docRef = doc(db, 'settings', 'church');
      await setDoc(docRef, updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Erro ao atualizar configurações');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};