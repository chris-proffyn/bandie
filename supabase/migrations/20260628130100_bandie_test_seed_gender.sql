-- Assign gender to test players for directory filter demos

do $$
declare
  r record;
  i integer := 0;
begin
  for r in
    select user_id
    from public.bandie_profiles
    where test_user = true
    order by user_id
  loop
    i := i + 1;
    update public.bandie_profiles
    set gender = case (i - 1) % 4
      when 0 then 'female'
      when 1 then 'male'
      when 2 then 'non_binary'
      else 'prefer_not_to_say'
    end
    where user_id = r.user_id;
  end loop;
end;
$$;
