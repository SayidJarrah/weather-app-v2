import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const citiesFixture = [
  { id: 1, name: 'New York', timezone: 'America/New_York' },
  { id: 2, name: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { id: 3, name: 'London', timezone: 'Europe/London' },
  { id: 4, name: 'Paris', timezone: 'Europe/Paris' },
  { id: 5, name: 'Tokyo', timezone: 'Asia/Tokyo' }
];

const buildWeatherPayload = (ids: number[]) => ({
  generatedAt: '2024-05-01T10:00:00Z',
  cities: ids.map((id) => {
    const meta = citiesFixture.find((city) => city.id === id);
    if (!meta) {
      throw new Error(`Missing city meta for id ${id}`);
    }
    return {
      cityId: meta.id,
      cityName: meta.name,
      temperatureCelsius: id * 3,
      status: 'OK',
      dataTimestamp: '2024-05-01T09:55:00Z',
      message: null,
      timezone: meta.timezone
    };
  })
});

describe('App', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    Object.assign(import.meta.env, { VITE_BACKEND_URL: '' });
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/cities')) {
        return new Response(JSON.stringify(citiesFixture), { status: 200 });
      }
      if (url.includes('/api/weather')) {
        const parsed = new URL(url, 'http://localhost');
        const ids = parsed.searchParams.getAll('cityIds').map((value) => Number(value));
        return new Response(JSON.stringify(buildWeatherPayload(ids)), { status: 200 });
      }
      return new Response(null, { status: 404 });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(import.meta.env, originalEnv);
  });

  it('renders default selection of cities', async () => {
    render(<App />);

    await waitFor(() => {
      const cards = screen.queryAllByTestId(/city-card-\d+/);
      expect(cards).toHaveLength(4);
    });
  });

  it('allows adding a new city from the dropdown', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId(/city-card-\d+/)).not.toHaveLength(0));

    const controls = screen.getAllByTestId('city-selector')[0];
    const select = within(controls).getByLabelText('Add city');
    await user.selectOptions(select, '5');
    await user.click(within(controls).getByRole('button', { name: 'Add city to dashboard' }));

    await waitFor(() => expect(screen.getAllByTestId(/city-card-\d+/).some((card) => card.dataset.testid === 'city-card-5')).toBe(true));

    const options = within(select).getAllByRole('option');
    expect(options.some((option) => option.textContent === 'Tokyo' && option.hasAttribute('selected'))).toBeFalsy();
  });

  it('allows removing a city card', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId(/city-card-\d+/).length).toBeGreaterThan(0));

    const card = screen.getAllByTestId('city-card-1')[0];
    await user.click(within(card).getByRole('button', { name: 'Remove New York' }));

    await waitFor(() => expect(screen.queryAllByTestId('city-card-1')).toHaveLength(0));

    const controls = screen.getAllByTestId('city-selector')[0];
    const select = within(controls).getByLabelText('Add city');
    expect(within(select).getAllByRole('option').some((option) => option.textContent === 'New York')).toBe(true);
  });
});
