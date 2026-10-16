-- One row per UTC day, metric and route. Nothing else is stored.
-- metric: opens and novoice (route 0); started, finished, misses and hints (routes 1 to 7)
CREATE TABLE IF NOT EXISTS counts (
  day    TEXT    NOT NULL,
  metric TEXT    NOT NULL,
  route  INTEGER NOT NULL,
  n      INTEGER NOT NULL,
  PRIMARY KEY (day, metric, route)
);

-- Crashes (2.2): one row per UTC day and game version, so a bad release shows up.
CREATE TABLE IF NOT EXISTS crashes (
  day TEXT    NOT NULL,
  app TEXT    NOT NULL,
  n   INTEGER NOT NULL,
  PRIMARY KEY (day, app)
);
