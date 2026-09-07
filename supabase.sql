create extension if not exists pgcrypto;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references businesses(id)
    on delete cascade,

  name text not null,

  whatsapp_number text not null
    check (whatsapp_number ~ '^[0-9]{10}$'),

  sale_amount numeric not null
    check (sale_amount > 0),

  status text not null default 'pending'
    check (status in ('pending', 'sent', 'cancelled')),

  scheduled_time timestamptz not null,

  sent_at timestamptz null,

  cancelled_at timestamptz null,

  created_at timestamptz default now()
);

create index if not exists customers_business_id_idx
on customers(business_id);

create index if not exists customers_status_schedule_idx
on customers(status, scheduled_time);

create index if not exists customers_created_at_idx
on customers(created_at desc);


create or replace function get_business_stats(
  p_business_id uuid
)
returns json
language sql
stable
as $$
  select json_build_object(

    'total_customers_this_month',
    count(*),

    'pending',
    count(*) filter (
      where status = 'pending'
    ),

    'sent',
    count(*) filter (
      where status = 'sent'
    ),

    'cancelled',
    count(*) filter (
      where status = 'cancelled'
    ),

    'total_sale_amount_this_month',
    coalesce(sum(sale_amount), 0),

    'average_sale_amount',
    coalesce(avg(sale_amount), 0)

  )

  from customers

  where business_id = p_business_id

    and created_at >= date_trunc(
      'month',
      now()
    )

    and created_at < date_trunc(
      'month',
      now()
    ) + interval '1 month';
$$;