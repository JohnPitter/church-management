// Presentation Component - Linkify
// Renders plain text turning http(s) URLs into clickable links

import React from 'react';

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const isUrl = (value: string): boolean => /^https?:\/\//.test(value);

// Trailing punctuation that usually does not belong to the URL
const trimTrailingPunctuation = (url: string): { url: string; trailing: string } => {
  const match = url.match(/[).,;!?]+$/);
  if (!match) return { url, trailing: '' };
  return { url: url.slice(0, -match[0].length), trailing: match[0] };
};

interface LinkifyProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

export const Linkify: React.FC<LinkifyProps> = ({ text, className, linkClassName }) => {
  const parts = text.split(URL_SPLIT_REGEX);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, index) => {
        if (!isUrl(part)) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const { url, trailing } = trimTrailingPunctuation(part);
        return (
          <React.Fragment key={index}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName || 'text-indigo-600 hover:text-indigo-800 underline break-words'}
            >
              {url}
            </a>
            {trailing}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default Linkify;
