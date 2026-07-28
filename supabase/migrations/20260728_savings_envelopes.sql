alter table public.savings_goals
  add column if not exists description text;

alter table public.savings_goals
  drop constraint if exists savings_goals_description_check;

alter table public.savings_goals
  add constraint savings_goals_description_check
  check (description is null or char_length(description) <= 240);

alter table public.savings_goals
  alter column target_amount drop not null;

alter table public.savings_goals
  drop constraint if exists savings_goals_target_amount_check;

alter table public.savings_goals
  add constraint savings_goals_target_amount_check
  check (target_amount is null or target_amount > 0);
