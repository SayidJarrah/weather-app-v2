import { useCallback, useEffect, useMemo, useState } from 'react';

type WeatherStatus = 'OK' | 'ERROR';

type CityWeather = {
  cityName: string;
  temperatureCelsius: number | null;
  status: WeatherStatus | 'PENDING';
  dataTimestamp: string | null;
  message: string | null;
};

type WeatherSnapshot = {
  generatedAt: string;
  cities: CityWeather[];
};

type FetchState =
  | { status: 'idle' | 'loading'; data: WeatherSnapshot | null; error: string | null }
  | { status: 'loaded'; data: WeatherSnapshot; error: string | null };

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';
const WEATHER_ENDPOINT = `${BACKEND_URL}/api/weather`;

const App = () => {
  const [state, setState] = useState<FetchState>({ status: 'idle', data: null, error: null });

  const fetchWeather = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    console.debug('[WeatherDashboard] Fetching weather', {
      endpoint: WEATHER_ENDPOINT,
      backendUrl: BACKEND_URL,
      timestamp: new Date().toISOString()
    });
    try {
      const response = await fetch(WEATHER_ENDPOINT);
      if (!response.ok) {
        console.error('[WeatherDashboard] Weather fetch failed', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = (await response.json()) as WeatherSnapshot;
      console.debug('[WeatherDashboard] Weather fetch succeeded', {
        cityCount: payload.cities.length,
        generatedAt: payload.generatedAt
      });
      setState({ status: 'loaded', data: payload, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WeatherDashboard] Weather fetch encountered error', {
        error: errorMessage,
        endpoint: WEATHER_ENDPOINT
      });
      setState((prev) => ({ ...prev, status: 'idle', error: errorMessage }));
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const lastUpdated = useMemo(() => {
    if (state.data?.generatedAt) {
      return formatDateTime(state.data.generatedAt);
    }
    return null;
  }, [state.data?.generatedAt]);

  const cities = state.data?.cities ?? PLACEHOLDER_CITIES;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Simple Weather Dashboard</h1>
          <p className="dashboard__subtitle">Current temperatures for Kyiv, Singapore, London, and Sydney.</p>
        </div>
        <div className="dashboard__actions">
          <button className="dashboard__refresh" onClick={fetchWeather} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
          {lastUpdated && <span className="dashboard__timestamp">Last updated: {lastUpdated}</span>}
        </div>
      </header>

      {state.error && (
        <div role="alert" className="dashboard__error">
          <span>Unable to load weather data. {state.error}</span>
        </div>
      )}

      <main className="dashboard__grid">
        {cities.map((city) => {
          const cardStatus = city.status.toLowerCase();
          const isHealthy = city.status === 'OK';
          return (
            <article key={city.cityName} className={`weather-card weather-card--${cardStatus}`}>
              <header className="weather-card__header">
                <h2>{city.cityName}</h2>
                {isHealthy && city.dataTimestamp && (
                  <span className="weather-card__timestamp">As of {formatTime(city.dataTimestamp)}</span>
                )}
              </header>
              <div className="weather-card__body">
                {isHealthy && typeof city.temperatureCelsius === 'number' ? (
                  <span className="weather-card__temperature">{Math.round(city.temperatureCelsius)}°C</span>
                ) : (
                  <span className="weather-card__message">{city.message ?? 'Error fetching data'}</span>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};

const PLACEHOLDER_CITIES: CityWeather[] = [
  { cityName: 'Kyiv', temperatureCelsius: null, status: 'PENDING', dataTimestamp: null, message: 'Loading…' },
  { cityName: 'Singapore', temperatureCelsius: null, status: 'PENDING', dataTimestamp: null, message: 'Loading…' },
  { cityName: 'London', temperatureCelsius: null, status: 'PENDING', dataTimestamp: null, message: 'Loading…' },
  { cityName: 'Sydney', temperatureCelsius: null, status: 'PENDING', dataTimestamp: null, message: 'Loading…' }
];

const formatDateTime = (isoDate: string) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return formatter.format(new Date(isoDate));
};

const formatTime = (isoDate: string) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short'
  });
  return formatter.format(new Date(isoDate));
};

export default App;
