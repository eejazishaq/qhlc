-- International dial code for mobile numbers (e.g. +966, +91)
ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS phone_code TEXT;

COMMENT ON COLUMN countries.phone_code IS 'E.164-style calling code, e.g. +966';
