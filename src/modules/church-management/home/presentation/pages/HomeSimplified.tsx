// Presentation Page - Home (Simplified with 3 Ready Layouts)
// Loads settings and renders appropriate layout

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from 'presentation/hooks/usePermissions';
import { SystemModule, PermissionAction } from 'domain/entities/Permission';
import { HomeSettingsService } from '@modules/content-management/home-settings/application/services/HomeSettingsService';
import {
  DEFAULT_HOME_SETTINGS,
  HomeSettings,
  HomeLayoutStyle
} from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import { CanvaHomeLayout } from 'presentation/components/HomeLayouts/CanvaHomeLayout';
import { AppleHomeLayout } from 'presentation/components/HomeLayouts/AppleHomeLayout';
import { EnterpriseHomeLayout } from 'presentation/components/HomeLayouts/EnterpriseHomeLayout';
import { BibleVerse, getVerseOfTheDay } from 'data/verses';

const HomeSimplified: React.FC = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [verseOfDay, setVerseOfDay] = useState<BibleVerse>(getVerseOfTheDay());
  const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);

  const homeSettingsService = new HomeSettingsService();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update verse at midnight
  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const newVerse = getVerseOfTheDay();
      if (newVerse.reference !== verseOfDay.reference) {
        setVerseOfDay(newVerse);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkDayChange);
  }, [verseOfDay.reference]);

  // Load home settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await homeSettingsService.getSettings();
        setHomeSettings(settings);
      } catch (error) {
        console.error('Error loading home settings:', error);
        setHomeSettings({
          id: 'default',
          ...DEFAULT_HOME_SETTINGS,
          updatedAt: new Date(),
          updatedBy: ''
        });
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect professionals to their panel
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser?.role === 'professional' && hasPermission(SystemModule.Assistance, PermissionAction.View)) {
      navigate('/professional');
    }
  }, [hasPermission, navigate]);

  if (!homeSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Carregando...
      </div>
    );
  }

  // Render appropriate layout based on settings
  const layoutProps = {
    sections: homeSettings.sections,
    currentTime,
    verseOfDay
  };

  switch (homeSettings.layoutStyle) {
    case HomeLayoutStyle.APPLE:
      return <AppleHomeLayout {...layoutProps} />;
    case HomeLayoutStyle.ENTERPRISE:
      return <EnterpriseHomeLayout {...layoutProps} />;
    case HomeLayoutStyle.CANVA:
    default:
      return <CanvaHomeLayout {...layoutProps} />;
  }
};

export default HomeSimplified;
