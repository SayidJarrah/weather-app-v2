ALTER TABLE city ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);

UPDATE city SET timezone = COALESCE(timezone, 'UTC');

ALTER TABLE city ALTER COLUMN timezone SET NOT NULL;

DELETE FROM city;

INSERT INTO city (id, name, latitude, longitude, timezone) VALUES
  (1, 'New York', 40.7128, -74.0060, 'America/New_York'),
  (2, 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
  (3, 'London', 51.5072, -0.1276, 'Europe/London'),
  (4, 'Paris', 48.8566, 2.3522, 'Europe/Paris'),
  (5, 'Tokyo', 35.6895, 139.6917, 'Asia/Tokyo'),
  (6, 'Sydney', -33.8688, 151.2093, 'Australia/Sydney'),
  (7, 'Singapore', 1.3521, 103.8198, 'Asia/Singapore'),
  (8, 'Seoul', 37.5665, 126.9780, 'Asia/Seoul'),
  (9, 'Mumbai', 19.0760, 72.8777, 'Asia/Kolkata'),
  (10, 'Sao Paulo', -23.5505, -46.6333, 'America/Sao_Paulo'),
  (11, 'Mexico City', 19.4326, -99.1332, 'America/Mexico_City'),
  (12, 'Cairo', 30.0444, 31.2357, 'Africa/Cairo'),
  (13, 'Johannesburg', -26.2041, 28.0473, 'Africa/Johannesburg'),
  (14, 'Dubai', 25.2048, 55.2708, 'Asia/Dubai'),
  (15, 'Toronto', 43.6532, -79.3832, 'America/Toronto'),
  (16, 'Berlin', 52.5200, 13.4050, 'Europe/Berlin'),
  (17, 'Madrid', 40.4168, -3.7038, 'Europe/Madrid'),
  (18, 'Rome', 41.9028, 12.4964, 'Europe/Rome'),
  (19, 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
  (20, 'Buenos Aires', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires');

SELECT setval('city_id_seq', (SELECT MAX(id) FROM city));
