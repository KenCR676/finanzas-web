-- Finanzas Web - esquema inicial
-- Cada registro pertenece a un usuario autenticado.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency_code text not null default 'CRC'
    check (char_length(currency_code) = 3),
  period_mode text not null default 'monthly'
    check (period_mode in ('monthly', 'fortnightly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type text not null check (type in ('income', 'expense')),
  color text not null default '#64748b',
  icon text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name, type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  description text check (char_length(description) <= 240),
  transaction_date date not null default current_date,
  expense_kind text check (expense_kind in ('fixed', 'variable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.categories(id, user_id)
    on delete set null
);

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  description text not null check (char_length(trim(description)) between 1 and 240),
  frequency text not null default 'monthly'
    check (frequency in ('weekly', 'monthly', 'yearly')),
  day_of_month smallint check (day_of_month between 1 and 31),
  expense_kind text check (expense_kind in ('fixed', 'variable')),
  next_run_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.categories(id, user_id)
    on delete set null
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  target_date date,
  monthly_target numeric(14, 2) check (monthly_target > 0),
  contribution_frequency text not null default 'monthly'
    check (contribution_frequency in ('monthly', 'fortnightly')),
  color text not null default '#0f766e',
  icon text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.savings_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  savings_goal_id uuid not null,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount numeric(14, 2) not null check (amount > 0),
  movement_date date not null default current_date,
  description text check (char_length(description) <= 240),
  created_at timestamptz not null default now(),
  foreign key (savings_goal_id, user_id)
    references public.savings_goals(id, user_id)
    on delete cascade
);

create index categories_user_id_idx
  on public.categories(user_id);
create index transactions_user_date_idx
  on public.transactions(user_id, transaction_date desc);
create index transactions_user_type_idx
  on public.transactions(user_id, type);
create index recurring_transactions_user_idx
  on public.recurring_transactions(user_id, active);
create index savings_goals_user_idx
  on public.savings_goals(user_id, status);
create index savings_movements_goal_date_idx
  on public.savings_movements(savings_goal_id, movement_date desc);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_movements enable row level security;

create policy "Users manage their own profile"
  on public.profiles
  for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users manage their own categories"
  on public.categories
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own transactions"
  on public.transactions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own recurring transactions"
  on public.recurring_transactions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own savings goals"
  on public.savings_goals
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own savings movements"
  on public.savings_movements
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.profiles from anon;
revoke all on public.categories from anon;
revoke all on public.transactions from anon;
revoke all on public.recurring_transactions from anon;
revoke all on public.savings_goals from anon;
revoke all on public.savings_movements from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.recurring_transactions to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert, update, delete on public.savings_movements to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger recurring_transactions_set_updated_at
before update on public.recurring_transactions
for each row execute function public.set_updated_at();

create trigger savings_goals_set_updated_at
before update on public.savings_goals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  insert into public.categories (user_id, name, type, color, icon)
  values
    (new.id, 'Salario', 'income', '#16a34a', 'wallet'),
    (new.id, 'Otros ingresos', 'income', '#22c55e', 'circle-plus'),
    (new.id, 'Vivienda', 'expense', '#7c3aed', 'house'),
    (new.id, 'Alimentación', 'expense', '#ea580c', 'utensils'),
    (new.id, 'Transporte', 'expense', '#2563eb', 'car'),
    (new.id, 'Servicios', 'expense', '#0891b2', 'receipt'),
    (new.id, 'Entretenimiento', 'expense', '#db2777', 'popcorn'),
    (new.id, 'Otros gastos', 'expense', '#64748b', 'ellipsis');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
