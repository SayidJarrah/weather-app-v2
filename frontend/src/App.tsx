import { useCallback, useEffect, useMemo, useState } from 'react';

type WeatherStatus = 'OK' | 'ERROR';

type CityWeather = {
  cityId: number;
  cityName: string;
  temperatureCelsius: number | null;
  status: WeatherStatus | 'PENDING';
  dataTimestamp: string | null;
  message: string | null;
  timezone: string;
};

type WeatherSnapshot = {
  generatedAt: string;
  cities: CityWeather[];
};

type CityOption = {
  id: number;
  name: string;
  timezone: string;
};

type FetchState =
  | { status: 'idle' | 'loading'; data: WeatherSnapshot | null; error: string | null }
  | { status: 'loaded'; data: WeatherSnapshot; error: string | null };

type TemperatureBucket = 'cold' | 'mild' | 'warm' | 'hot' | 'unknown';

const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const WEATHER_ENDPOINT = `${rawBackendUrl}/api/weather`;
const CITIES_ENDPOINT = `${rawBackendUrl}/api/cities`;

const App = () => {
  const [state, setState] = useState<FetchState>({ status: 'idle', data: null, error: null });
  const [availableCities, setAvailableCities] = useState<CityOption[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
  const [pendingCityId, setPendingCityId] = useState<number | ''>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const fetchWeather = useCallback(
    async (cityIds: number[]) => {
      if (cityIds.length === 0) {
        setSelectedCityIds([]);
        setState({ status: 'loaded', data: { generatedAt: new Date().toISOString(), cities: [] }, error: null });
        return;
      }

      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      console.debug('[WeatherDashboard] Fetching weather', {
        endpoint: WEATHER_ENDPOINT,
        backendUrl: rawBackendUrl,
        cityIds,
        timestamp: new Date().toISOString()
      });

      try {
        const params = new URLSearchParams();
        cityIds.forEach((id) => params.append('cityIds', id.toString()));
        const url = `${WEATHER_ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
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
        setSelectedCityIds(cityIds);
        setState({ status: 'loaded', data: payload, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[WeatherDashboard] Weather fetch encountered error', {
          error: errorMessage,
          endpoint: WEATHER_ENDPOINT
        });
        setState((prev) => ({ ...prev, status: 'idle', error: errorMessage }));
      }
    },
    []
  );

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch(CITIES_ENDPOINT);
        if (!response.ok) {
          throw new Error(`Failed to load cities (${response.status})`);
        }
        const cities = (await response.json()) as CityOption[];
        setAvailableCities(cities);
        if (cities.length > 0 && selectedCityIds.length === 0) {
          const defaults = cities.slice(0, 4).map((city) => city.id);
          setSelectedCityIds(defaults);
          void fetchWeather(defaults);
        }
      } catch (error) {
        console.error('[WeatherDashboard] Failed to load cities', error);
      }
    };

    loadCities();
  }, [fetchWeather, selectedCityIds.length]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('theme-dark');
    } else {
      root.classList.remove('theme-dark');
    }
  }, [isDarkMode]);

  const lastUpdated = useMemo(() => {
    if (state.data?.generatedAt) {
      return formatDateTime(state.data.generatedAt);
    }
    return null;
  }, [state.data?.generatedAt]);

  const renderedCities: CityWeather[] = useMemo(() => {
    if (state.data?.cities) {
      return state.data.cities;
    }

    return selectedCityIds.reduce<CityWeather[]>((acc, id) => {
      const meta = availableCities.find((city) => city.id === id);
      if (!meta) {
        return acc;
      }
      acc.push({
        cityId: meta.id,
        cityName: meta.name,
        temperatureCelsius: null,
        status: 'PENDING',
        dataTimestamp: null,
        message: 'Loading…',
        timezone: meta.timezone
      });
      return acc;
    }, []);
  }, [state.data?.cities, selectedCityIds, availableCities]);

  const selectableCities = useMemo(
    () => availableCities.filter((city) => !selectedCityIds.includes(city.id)),
    [availableCities, selectedCityIds]
  );

  const handleAddCity = () => {
    if (pendingCityId === '') {
      return;
    }
    const nextIds = selectedCityIds.includes(pendingCityId)
      ? selectedCityIds
      : [...selectedCityIds, pendingCityId];
    setSelectedCityIds(nextIds);
    void fetchWeather(nextIds);
    setPendingCityId('');
  };

  const handleRemoveCity = (cityId: number) => {
    const nextIds = selectedCityIds.filter((id) => id !== cityId);
    setSelectedCityIds(nextIds);
    void fetchWeather(nextIds);
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__title">
          <span className="dashboard__logo" role="img" aria-label="Weather globe">
            🌍
          </span>
          <div>
            <h1>Simple Weather Dashboard</h1>
            <p className="dashboard__subtitle">Track live weather across your selected cities.</p>
          </div>
        </div>
        <div className="dashboard__actions">
          <button
            className="dashboard__mode-toggle"
            onClick={() => setIsDarkMode((value) => !value)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '🌙 Dark' : '🌞 Light'}
          </button>
          <button
            className="dashboard__refresh"
            onClick={() => fetchWeather(selectedCityIds)}
            disabled={state.status === 'loading'}
            aria-label="Refresh weather"
          >
            {state.status === 'loading' ? <span className="spinner" aria-hidden="true" /> : '🔄'}
          </button>
          {lastUpdated && <span className="dashboard__timestamp">Last updated: {lastUpdated}</span>}
        </div>
      </header>

      <section className="dashboard__selector">
        <label className="dashboard__selector-label" htmlFor="city-select">
          Add city
        </label>
        <div
          className="dashboard__selector-controls"
          role="group"
          aria-label="City selection"
          data-testid="city-selector"
        >
          <select
            id="city-select"
            value={pendingCityId === '' ? '' : pendingCityId}
            onChange={(event) => {
              const value = event.target.value;
              setPendingCityId(value === '' ? '' : Number(value));
            }}
            disabled={selectableCities.length === 0}
          >
            <option value="" disabled>
              {selectableCities.length === 0 ? 'All cities selected' : 'Choose a city'}
            </option>
            {selectableCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <button
            className="dashboard__add"
            onClick={handleAddCity}
            disabled={pendingCityId === ''}
            aria-label="Add city to dashboard"
          >
            Add
          </button>
        </div>
      </section>

      {state.error && (
        <div role="alert" className="dashboard__error">
          <span>Unable to load weather data. {state.error}</span>
        </div>
      )}

      <main className="dashboard__grid" data-testid="dashboard-grid">
        {renderedCities.map((city) => {
          const cardStatus = city.status.toLowerCase();
          const isHealthy = city.status === 'OK';
          const bucket = categorizeTemperature(city.temperatureCelsius);
          const backgroundStyle = { background: gradientForBucket(bucket) };
          return (
            <article
              key={city.cityId}
              className={`weather-card weather-card--${cardStatus}`}
              data-testid={city.status === 'PENDING' ? `city-card-placeholder-${city.cityId}` : `city-card-${city.cityId}`}
              style={isHealthy ? backgroundStyle : undefined}
            >
              <header className="weather-card__header">
                <div className="weather-card__heading">
                  <h2>{city.cityName}</h2>
                  <span className="weather-card__icon" aria-hidden="true">
                    {isHealthy ? iconForBucket(bucket) : '⚠️'}
                  </span>
                </div>
                <div className="weather-card__meta">
                  <span className="weather-card__timestamp">Local time: {formatLocalTime(city.timezone)}</span>
                  <button
                    className="weather-card__remove"
                    onClick={() => handleRemoveCity(city.cityId)}
                    aria-label={`Remove ${city.cityName}`}
                  >
                    Remove
                  </button>
                </div>
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

const formatDateTime = (isoDate: string) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return formatter.format(new Date(isoDate));
};

const formatLocalTime = (timezone: string) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
    hourCycle: 'h23',
    timeZone: timezone
  });
  return formatter.format(new Date());
};

const categorizeTemperature = (temp: number | null): TemperatureBucket => {
  if (temp === null || Number.isNaN(temp)) return 'unknown';
  if (temp < 10) return 'cold';
  if (temp < 20) return 'mild';
  if (temp < 30) return 'warm';
  return 'hot';
};

const gradientForBucket = (bucket: TemperatureBucket) => {
  switch (bucket) {
    case 'cold':
      return 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(129,140,248,0.55))';
    case 'mild':
      return 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(45,212,191,0.55))';
    case 'warm':
      return 'linear-gradient(135deg, rgba(251,191,36,0.45), rgba(252,211,77,0.65))';
    case 'hot':
      return 'linear-gradient(135deg, rgba(248,113,113,0.45), rgba(239,68,68,0.65))';
    default:
      return 'linear-gradient(135deg, rgba(148,163,184,0.25), rgba(226,232,240,0.45))';
  }
};

const iconForBucket = (bucket: TemperatureBucket) => {
  switch (bucket) {
    case 'cold':
      return '❄️';
    case 'mild':
      return '🌤️';
    case 'warm':
      return '☀️';
    case 'hot':
      return '🔥';
    default:
      return 'ℹ️';
  }
};

export default App;
