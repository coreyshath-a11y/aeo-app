-- Update handle_new_user to handle OAuth signups
-- Google sends: full_name, name, avatar_url, email
-- Apple sends: name, email
-- Email/password sends: full_name, company_name, accepted_terms, marketing_consent

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, company_name, accepted_terms, accepted_terms_at, marketing_consent)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce((new.raw_user_meta_data->>'accepted_terms')::boolean, true),
    now(),
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, true)
  );
  return new;
end;
$$;
