CREATE TABLE IF NOT EXISTS city (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

INSERT INTO city (id, name, latitude, longitude) VALUES
    (1, 'Kyiv', 50.4501, 30.5234),
    (2, 'Singapore', 1.3521, 103.8198),
    (3, 'London', 51.5072, -0.1276),
    (4, 'Sydney', -33.8688, 151.2093)
ON CONFLICT (id) DO NOTHING;

SELECT setval('city_id_seq', (SELECT MAX(id) FROM city));
