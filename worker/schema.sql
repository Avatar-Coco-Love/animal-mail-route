-- One row per UTC day, metric and route. Nothing else is stored.
-- metric: opens (route 0), started, finished, misses (routes 1 to 4)
CREATE TABLE IF NOT EXISTS counts (
  day    TEXT    NOT NULL,
  metric TEXT    NOT NULL,
  route  INTEGER NOT NULL,
  n      INTEGER NOT NULL,
  PRIMARY KEY (day, metric, route)
);
