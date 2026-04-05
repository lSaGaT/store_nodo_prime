-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'atendente');

-- ============================================================
-- TABELA: profiles
-- Perfil dos usuários com controle de acesso
-- ============================================================
create table public.profiles (
  id uuid not null,
  email text null,
  full_name text null,
  role public.user_role null default 'atendente'::user_role,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);

-- ============================================================
-- TABELA: products
-- Catálogo de sistemas disponíveis para venda
-- ============================================================
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nome        text not null,
  descricao   text,
  descricao_longa text,
  preco       numeric(10,2) not null,
  file_key    text not null,            -- chave do arquivo no R2
  ativo       boolean default true,
  ordem       int default 0,            -- ordem de exibição na landing
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABELA: orders
-- Registra cada tentativa/compra
-- ============================================================
create table orders (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id),
  asaas_payment_id  text unique not null,
  email             text not null,
  status            text not null default 'pending',
  -- status: pending | paid | expired | refunded
  valor             numeric(10,2) not null,
  forma_pagamento   text,
  -- forma_pagamento: PIX | BOLETO | CREDIT_CARD
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================
-- TABELA: download_tokens
-- Tokens únicos gerados após pagamento confirmado
-- ============================================================
create table download_tokens (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id),
  token       text unique not null default gen_random_uuid()::text,
  used_by_ip  text,                     -- IP registrado no download
  downloaded  boolean default false,
  expires_at  timestamptz not null default now() + interval '24 hours',
  created_at  timestamptz default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_orders_asaas_payment_id on orders(asaas_payment_id);
create index idx_orders_status on orders(status);
create index idx_download_tokens_token on download_tokens(token);
create index idx_download_tokens_order_id on download_tokens(order_id);
create index idx_products_slug on products(slug);
create index idx_products_ativo on products(ativo);

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table products enable row level security;
alter table orders enable row level security;
alter table download_tokens enable row level security;

-- Apenas service_role acessa (Next.js usa service_role key)
create policy "service_role full access products"
  on products for all using (auth.role() = 'service_role');

create policy "service_role full access orders"
  on orders for all using (auth.role() = 'service_role');

create policy "service_role full access tokens"
  on download_tokens for all using (auth.role() = 'service_role');

-- ============================================================
-- RLS: profiles
-- ============================================================
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "service_role full access profiles"
  on profiles for all using (auth.role() = 'service_role');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Owner can promote themselves to admin"
  on profiles for update
  using (auth.uid() = id AND auth.jwt() ->> 'email' in ('soundsvibee@gmail.com', 'lucas@teste.com'))
  with check (role = 'admin');

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Função para criar perfil automaticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    case 
      when new.email in ('soundsvibee@gmail.com', 'lucas@teste.com') then 'admin'::public.user_role 
      else 'atendente'::public.user_role 
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger disparado após criação de usuário no Auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
