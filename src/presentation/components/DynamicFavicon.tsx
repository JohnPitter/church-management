import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const DynamicFavicon: React.FC = () => {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.logoURL) {
      // Update favicon
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.logoURL;
      } else {
        // Create favicon if it doesn't exist
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = settings.logoURL;
        document.head.appendChild(newFavicon);
      }

      // Update apple-touch-icon
      const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleTouchIcon) {
        appleTouchIcon.href = settings.logoURL;
      }

      // Update Open Graph image
      const ogImage = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
      if (ogImage) {
        ogImage.content = settings.logoURL;
      }

      // Update Twitter image
      const twitterImage = document.querySelector("meta[property='twitter:image']") as HTMLMetaElement;
      if (twitterImage) {
        twitterImage.content = settings.logoURL;
      }

      // Update title with church name
      if (settings.churchName) {
        document.title = settings.churchName;
        
        // Update Open Graph title
        const ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement;
        if (ogTitle) {
          ogTitle.content = settings.churchName;
        }

        // Update Twitter title
        const twitterTitle = document.querySelector("meta[property='twitter:title']") as HTMLMetaElement;
        if (twitterTitle) {
          twitterTitle.content = settings.churchName;
        }

        // Update site name
        const ogSiteName = document.querySelector("meta[property='og:site_name']") as HTMLMetaElement;
        if (ogSiteName) {
          ogSiteName.content = settings.churchName;
        }
      }
    }
  }, [settings?.logoURL, settings?.churchName]);

  return null;
};