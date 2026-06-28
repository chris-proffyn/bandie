-- Assign a pseudo-random UK mobile contact phone to every user profile for demos.

update public.bandie_profiles
set contact_phone = '07' || lpad(
  (abs(hashtext(user_id::text)) % 900000000 + 100000000)::text,
  9,
  '0'
);
