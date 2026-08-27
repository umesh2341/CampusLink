CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS redbull_car_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_label VARCHAR(50) NOT NULL DEFAULT 'REDBULL_CAR_01',
  latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  accuracy NUMERIC(8, 2) CHECK (accuracy >= 0),
  altitude NUMERIC(8, 2),
  heading NUMERIC(6, 2) CHECK (heading >= 0 AND heading <= 360),
  speed NUMERIC(6, 2) CHECK (speed >= 0),
  secret_token_hash TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_redbull_device UNIQUE (device_label)
);

ALTER TABLE redbull_car_telemetry REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_redbull_telemetry_updated_at ON redbull_car_telemetry(updated_at DESC);

ALTER TABLE redbull_car_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active redbull vehicle location" ON redbull_car_telemetry;
CREATE POLICY "Public can view active redbull vehicle location"
  ON redbull_car_telemetry
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Deny direct anon insert or update on redbull telemetry" ON redbull_car_telemetry;
CREATE POLICY "Deny direct anon insert or update on redbull telemetry"
  ON redbull_car_telemetry
  FOR ALL
  TO anon
  USING (FALSE)
  WITH CHECK (FALSE);

DROP FUNCTION IF EXISTS upsert_redbull_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS upsert_redbull_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN);

CREATE OR REPLACE FUNCTION upsert_redbull_location(
  p_device_label TEXT DEFAULT 'REDBULL_CAR_01',
  p_secret_token TEXT DEFAULT 'redbull2026',
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL,
  p_accuracy DOUBLE PRECISION DEFAULT NULL,
  p_altitude DOUBLE PRECISION DEFAULT NULL,
  p_heading DOUBLE PRECISION DEFAULT NULL,
  p_speed DOUBLE PRECISION DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret TEXT;
  v_expected_hash TEXT;
  v_provided_hash TEXT;
  v_row redbull_car_telemetry%ROWTYPE;
BEGIN
  v_secret := COALESCE(NULLIF(TRIM(p_secret_token), ''), 'redbull2026');

  IF p_latitude IS NULL OR p_latitude < -90 OR p_latitude > 90 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_LATITUDE');
  END IF;

  IF p_longitude IS NULL OR p_longitude < -180 OR p_longitude > 180 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_LONGITUDE');
  END IF;

  v_provided_hash := encode(sha256(convert_to(v_secret, 'UTF8')), 'hex');

  SELECT secret_token_hash INTO v_expected_hash
  FROM redbull_car_telemetry
  WHERE device_label = COALESCE(p_device_label, 'REDBULL_CAR_01');

  IF v_expected_hash IS NOT NULL AND v_expected_hash <> '' AND v_expected_hash <> v_provided_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  INSERT INTO redbull_car_telemetry (
    device_label,
    latitude,
    longitude,
    accuracy,
    altitude,
    heading,
    speed,
    secret_token_hash,
    is_active,
    updated_at
  )
  VALUES (
    COALESCE(p_device_label, 'REDBULL_CAR_01'),
    p_latitude,
    p_longitude,
    p_accuracy,
    p_altitude,
    p_heading,
    p_speed,
    v_provided_hash,
    COALESCE(p_is_active, TRUE),
    NOW()
  )
  ON CONFLICT (device_label)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    altitude = EXCLUDED.altitude,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    secret_token_hash = v_provided_hash,
    is_active = COALESCE(p_is_active, TRUE),
    updated_at = NOW()
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'success', true,
    'device_label', v_row.device_label,
    'latitude', v_row.latitude,
    'longitude', v_row.longitude,
    'accuracy', v_row.accuracy,
    'heading', v_row.heading,
    'is_active', v_row.is_active,
    'updated_at', v_row.updated_at
  );
END;
$$;

DROP VIEW IF EXISTS redbull_car_live;
CREATE VIEW redbull_car_live AS
SELECT
  id,
  device_label,
  latitude::DOUBLE PRECISION AS latitude,
  longitude::DOUBLE PRECISION AS longitude,
  accuracy::DOUBLE PRECISION AS accuracy,
  altitude::DOUBLE PRECISION AS altitude,
  heading::DOUBLE PRECISION AS heading,
  speed::DOUBLE PRECISION AS speed,
  is_active,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))::INTEGER AS seconds_since_update,
  CASE
    WHEN is_active = FALSE THEN 'OFFLINE'
    WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) > 120 THEN 'OFFLINE'
    WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) > 30 THEN 'DELAYED'
    WHEN accuracy > 60 THEN 'WEAK_GPS'
    ELSE 'LIVE'
  END AS status
FROM redbull_car_telemetry;

GRANT SELECT ON redbull_car_live TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_redbull_location TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'redbull_car_telemetry'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE redbull_car_telemetry;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
