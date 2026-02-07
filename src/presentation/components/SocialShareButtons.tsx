import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  imageUrl?: string;
  className?: string;
  showText?: boolean;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description = '',
  hashtags = [],
  via = 'igreja',
  imageUrl = '',
  className = '',
  showText = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedHashtags = hashtags.join(',');
  const encodedImageUrl = encodeURIComponent(imageUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}${description ? '%20-%20' + encodedDescription : ''}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${description ? '%20-%20' + encodedDescription : ''}&via=${via}${hashtags.length ? '&hashtags=' + encodedHashtags : ''}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}${description ? '%20-%20' + encodedDescription : ''}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}${description ? '%20-%20' + encodedDescription : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${description ? ' - ' + encodedDescription : ''}${imageUrl ? '&media=' + encodedImageUrl : ''}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    tumblr: `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedUrl}&title=${encodedTitle}&caption=${encodedDescription}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedTitle}${description ? '%0A%0A' + encodedDescription : ''}%0A%0A${encodedUrl}`,
  };

  const socialNetworks = [
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: shareLinks.facebook
    },
    {
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-sky-500 hover:bg-sky-600',
      url: shareLinks.twitter
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      url: shareLinks.whatsapp
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-500 hover:bg-blue-600',
      url: shareLinks.telegram
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: shareLinks.linkedin
    },
    {
      name: 'Pinterest',
      icon: '📌',
      color: 'bg-red-600 hover:bg-red-700',
      url: shareLinks.pinterest
    },
    {
      name: 'Reddit',
      icon: '🤖',
      color: 'bg-orange-600 hover:bg-orange-700',
      url: shareLinks.reddit
    },
    {
      name: 'Tumblr',
      icon: '📝',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      url: shareLinks.tumblr
    },
    {
      name: 'Email',
      icon: '📧',
      color: 'bg-gray-600 hover:bg-gray-700',
      url: shareLinks.email
    }
  ];

  const handleShare = (url: string, networkName: string) => {
    setIsOpen(false); // Close dropdown after sharing
    if (networkName === 'Email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  };

  const copyToClipboard = async () => {
    setIsOpen(false); // Close dropdown after copying
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleNativeShare = async () => {
    setIsOpen(false);
    try {
      await navigator.share({
        title,
        text: description,
        url
      });
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };

  return (
    <div className={`social-share-buttons relative ${className}`} ref={dropdownRef}>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
      >
        <span>🔄</span>
        <span>Compartilhar</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-y-auto py-2"
             style={{
               position: 'fixed',
               top: dropdownRef.current ? (() => {
                 const rect = dropdownRef.current.getBoundingClientRect();
                 const dropdownHeight = 380; // Height needed for all options (~10 social networks + header)
                 const spaceBelow = window.innerHeight - rect.bottom - 16;
                 const spaceAbove = rect.top - 16;
                 
                 // If there's enough space below for full dropdown, position below
                 if (spaceBelow >= dropdownHeight) {
                   return rect.bottom + 8;
                 }
                 // If there's enough space above for full dropdown, position above
                 else if (spaceAbove >= dropdownHeight) {
                   return rect.top - dropdownHeight - 8;
                 }
                 // If more space below but not enough, position below but constrain height
                 else if (spaceBelow > spaceAbove) {
                   return rect.bottom + 8;
                 }
                 // If more space above, position above and constrain height
                 else {
                   return 16; // Position at top of screen with margin
                 }
               })() : 'auto',
               left: dropdownRef.current ? (() => {
                 const rect = dropdownRef.current.getBoundingClientRect();
                 const dropdownWidth = 256;
                 const spaceRight = window.innerWidth - rect.left - 16;
                 
                 // If there's enough space on the right, align to left
                 if (spaceRight >= dropdownWidth) {
                   return rect.left;
                 }
                 // Otherwise, align to right edge of screen with margin
                 else {
                   return Math.max(16, window.innerWidth - dropdownWidth - 16);
                 }
               })() : 'auto',
               maxHeight: dropdownRef.current ? (() => {
                 const rect = dropdownRef.current.getBoundingClientRect();
                 const dropdownHeight = 380;
                 const spaceBelow = window.innerHeight - rect.bottom - 16;
                 const spaceAbove = rect.top - 16;
                 
                 // If there's enough space below for full dropdown
                 if (spaceBelow >= dropdownHeight) {
                   return dropdownHeight + 'px';
                 }
                 // If there's enough space above for full dropdown
                 else if (spaceAbove >= dropdownHeight) {
                   return dropdownHeight + 'px';
                 }
                 // Use available space minus margins, minimum 250px for usability
                 else {
                   return Math.max(250, Math.max(spaceBelow - 8, window.innerHeight - 32)) + 'px';
                 }
               })() : '380px'
             }}>
          <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
            Compartilhar em:
          </div>
          
          {/* Native Share (if available) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <span className="text-lg">📱</span>
              <span>Compartilhar (Nativo)</span>
            </button>
          )}
          
          {/* Social Networks */}
          {socialNetworks.map((network) => (
            <button
              key={network.name}
              onClick={() => handleShare(network.url, network.name)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <span className="text-lg">{network.icon}</span>
              <span>{network.name}</span>
            </button>
          ))}
          
          {/* Copy Link */}
          <button
            onClick={copyToClipboard}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
          >
            <span className="text-lg">🔗</span>
            <span>Copiar Link</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialShareButtons;