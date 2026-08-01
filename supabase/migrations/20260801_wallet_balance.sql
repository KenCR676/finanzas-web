create or replace function public.current_wallet_balance(balance_date date default current_date)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    sum(
      case
        when type = 'income' then amount
        else -amount
      end
    ),
    0
  )
  from public.transactions
  where user_id = (select auth.uid())
    and transaction_date <= balance_date;
$$;

revoke all on function public.current_wallet_balance(date) from public;
revoke all on function public.current_wallet_balance(date) from anon;
grant execute on function public.current_wallet_balance(date) to authenticated;
