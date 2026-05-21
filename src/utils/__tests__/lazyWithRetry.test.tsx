import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { isChunkLoadError, lazyWithRetry } from '../lazyWithRetry';

describe('lazyWithRetry', () => {
  it('detects chunk loading errors', () => {
    expect(isChunkLoadError(new Error('Loading chunk 5220 failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Regular render error'))).toBe(false);
  });

  it('renders the loaded component', async () => {
    const LazyComponent = lazyWithRetry(async () => ({
      default: () => <div>Lazy route loaded</div>
    }));

    render(
      <Suspense fallback={<div>Loading</div>}>
        <LazyComponent />
      </Suspense>
    );

    expect(await screen.findByText('Lazy route loaded')).toBeInTheDocument();
  });
});
