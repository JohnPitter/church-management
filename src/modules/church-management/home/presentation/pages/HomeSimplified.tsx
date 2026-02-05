// Presentation Page - Home (Simplified with 3 Ready Layouts)
// Loads settings and renders appropriate layout

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from 'presentation/hooks/usePermissions';
import { SystemModule, PermissionAction } from 'domain/entities/Permission';
import { HomeSettingsService } from '@modules/content-management/home-settings/application/services/HomeSettingsService';
import { HomeSettings, HomeLayoutStyle } from '@modules/content-management/home-settings/domain/entities/HomeSettings';
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
  const [loading, setLoading] = useState(true);

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
        setLoading(true);
        const settings = await homeSettingsService.getSettings();
        setHomeSettings(settings);
      } catch (error) {
        console.error('Error loading home settings:', error);
        // Use default settings on error
        setHomeSettings({
          id: 'default',
          layoutStyle: HomeLayoutStyle.CANVA,
          sections: {
            hero: true,
            verseOfDay: true,
            quickActions: true,
            welcomeBanner: true,
            features: true,
            events: true,
            statistics: false,
            contact: false,
            testimonials: false,
            socialMedia: true
          },
          updatedAt: new Date(),
          updatedBy: ''
        });
      } finally {
        setLoading(false);
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

  // Loading state
  if (loading || !homeSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando página inicial...</p>
        </div>
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
