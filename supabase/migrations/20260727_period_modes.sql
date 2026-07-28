alter table public.profiles
  add column if not exists period_mode text not null default 'monthly';

alter table public.savings_goals
  add column if not exists contribution_frequency text not null default 'monthly';

do $$
begin
  alter table public.profiles
    add constraint profiles_period_mode_check
    check (period_mode in ('monthly', 'fortnightly'));
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.savings_goals
    add constraint savings_goals_contribution_frequency_check
    check (contribution_frequency in ('monthly', 'fortnightly'));
exception
  when duplicate_object then null;
end
$$;
