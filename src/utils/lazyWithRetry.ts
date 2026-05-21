import React, { ComponentType, LazyExoticComponent } from 'react';

const CHUNK_RELOAD_KEY_PREFIX = 'church-management:chunk-reload';
const RETRY_DELAYS_MS = [500, 1500];
const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
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

const getReloadKey = (): string => `${CHUNK_RELOAD_KEY_PREFIX}:${window.location.pathname}`;

export const clearChunkReloadAttempt = (): void => {
  sessionStorage.removeItem(getReloadKey());
};

const reloadOnceForFreshAssets = (): boolean => {
  const reloadKey = getReloadKey();

  if (sessionStorage.getItem(reloadKey) !== 'true') {
    sessionStorage.setItem(reloadKey, 'true');
    window.location.reload();
    return true;
  }

  return false;
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): LazyExoticComponent<T> => React.lazy(async () => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const module = await loader();
      clearChunkReloadAttempt();
      return module;
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

  if (isChunkLoadError(lastError)) {
    if (reloadOnceForFreshAssets()) {
      return new Promise(() => undefined);
    }
  }

  throw lastError;
});
