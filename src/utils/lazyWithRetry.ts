import React, { ComponentType, LazyExoticComponent } from 'react';

const RETRY_DELAYS_MS = [500, 1500];
const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Loading CSS chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed'
];

const wait = (delayMs: number): Promise<void> => (
  new Promise(resolve => {
    window.setTimeout(resolve, delayMs);
  })
);

export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error
    ? `${error.name} ${error.message}`
    : String(error);

  return CHUNK_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): LazyExoticComponent<T> => React.lazy(async () => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;

      if (!isChunkLoadError(error)) {
        throw error;
      }

      const delayMs = RETRY_DELAYS_MS[attempt];
      if (delayMs) {
        await wait(delayMs);
      }
    }
  }

  throw lastError;
});
