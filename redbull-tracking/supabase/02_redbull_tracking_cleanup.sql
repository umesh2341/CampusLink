DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'redbull_car_telemetry'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE redbull_car_telemetry;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;

DROP VIEW IF EXISTS redbull_car_live;
DROP FUNCTION IF EXISTS upsert_redbull_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP TABLE IF EXISTS redbull_car_telemetry CASCADE;
