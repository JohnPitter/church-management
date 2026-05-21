import React from 'react';
import { render, screen } from '@testing-library/react';
import { BuildVersionBadge } from '../BuildVersionBadge';

jest.mock('@/config/buildInfo', () => ({
  buildInfo: {
    version: '1.3.0',
    buildVersion: '1.3.0+abc123',
    gitSha: 'abc123',
    buildTime: '2026-05-21T12:00:00.000Z'
  }
}));

describe('BuildVersionBadge', () => {
  it('shows the deployed build version', () => {
    render(<BuildVersionBadge />);

    expect(screen.getByText('v1.3.0+abc123')).toBeInTheDocument();
    expect(screen.getByLabelText(/Versão 1\.3\.0\+abc123/)).toBeInTheDocument();
  });
});
