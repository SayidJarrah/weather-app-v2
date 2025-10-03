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

const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const WEATHER_ENDPOINT = `${rawBackendUrl}/api/weather`;
const CITIES_ENDPOINT = `${rawBackendUrl}/api/cities`;

const App = () => {
  const [state, setState] = useState<FetchState>({ status: 'idle', data: null, error: null });
  const [availableCities, setAvailableCities] = useState<CityOption[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);
  const [pendingCityId, setPendingCityId] = useState<number | ''>('');

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
        <div>
          <h1>Simple Weather Dashboard</h1>
          <p className="dashboard__subtitle">Current temperatures for Kyiv, Singapore, London, and Sydney.</p>
        </div>
        <div className="dashboard__actions">
          <button
            className="dashboard__refresh"
            onClick={() => fetchWeather(selectedCityIds)}
            disabled={state.status === 'loading'}
          >
            {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
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
          return (
            <article
              key={city.cityId}
              className={`weather-card weather-card--${cardStatus}`}
              data-testid={city.status === 'PENDING' ? `city-card-placeholder-${city.cityId}` : `city-card-${city.cityId}`}
            >
              <header className="weather-card__header">
                <h2>{city.cityName}</h2>
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

export default App;
