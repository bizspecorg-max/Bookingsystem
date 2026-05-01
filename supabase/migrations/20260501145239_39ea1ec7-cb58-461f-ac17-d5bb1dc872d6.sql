
-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'paid', 'cancelled');

-- Create spaces table
CREATE TABLE public.spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  user_location TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (space_id, booking_date)
);

-- Enable RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Spaces are publicly readable
CREATE POLICY "Spaces are publicly readable" ON public.spaces
  FOR SELECT TO anon, authenticated USING (true);

-- Bookings are publicly readable (needed to check availability)
CREATE POLICY "Bookings are publicly readable" ON public.bookings
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can create bookings
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
