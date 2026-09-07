import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import AdminWorkspace, { administrationModuleGroups } from './AdminWorkspace.jsx';

vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { accountType: 'TENANT_ADMIN', roles: ['SCHOOL_ADMIN'] },
    logout: vi.fn(),
  }),
}));

const expectedDestinations = [
  '/dashboard',
  '/students',
  '/teachers',
  '/subjects',
  '/classes',
  '/classroom',
  '/users',
  '/timetables',
  '/academic-calendar',
  '/attendance',
  '/academic-policies',
  '/examinations',
  '/results',
  '/finance',
  '/payment-gateway',
  '/communication',
  '/hr',
  '/library',
  '/assets-inventory',
  '/transport',
  '/boarding',
  '/security',
  '/analytics',
  '/ai-intelligence',
  '/smart-identity',
  '/iot',
  '/tenant-admin',
  '/billing',
  '/platform-admin',
  '/security-admin',
  '/ai-academic',
  '/ai-reports',
  '/ai-chat',
  '/integrations',
  '/biometrics',
  '/parent-portal',
  '/school-setup',
];

it('maps every administration module card to its intended application route', () => {
  render(
    <MemoryRouter>
      <AdminWorkspace />
    </MemoryRouter>
  );

  const configuredDestinations = administrationModuleGroups.flatMap(({ modules }) =>
    modules.map(([href]) => href)
  );
  expect(configuredDestinations).toEqual(expectedDestinations);
  expect(screen.getByText('37')).toBeInTheDocument();
  expect(new Set(configuredDestinations).size).toBe(configuredDestinations.length);

  for (const destination of expectedDestinations) {
    expect(
      screen.getAllByRole('link').some((link) => link.getAttribute('href') === destination)
    ).toBe(true);
  }
});
