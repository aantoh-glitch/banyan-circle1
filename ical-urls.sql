-- Add iCal URL columns to landlords table
ALTER TABLE landlords
  ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT,
  ADD COLUMN IF NOT EXISTS bookingcom_ical_url TEXT;
