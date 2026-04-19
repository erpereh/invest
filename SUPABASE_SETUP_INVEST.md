# Supabase Setup para Invest

Guia inicial para montar la base de datos de Invest en Supabase.

Invest queda planteada como una app privada de uso personal, sin login, desplegada en Vercel y centrada solo en fondos indexados identificados por ISIN. No se modelan acciones, ETFs individuales, dividendos de acciones, watchlists sociales, comunidad ni multiusuario.

## 1. Objetivo de la arquitectura

La arquitectura recomendada es:

- Next.js en Vercel como aplicacion privada.
- Supabase como base de datos PostgreSQL gestionada.
- Escrituras siempre desde backend: Route Handlers, Server Actions, cron jobs de Vercel o scripts privados.
- Cliente sin acceso directo de escritura a Supabase.
- RLS activado y sin politicas permisivas para claves publicas.
- `SUPABASE_SERVICE_ROLE_KEY` solo en entorno servidor.

Aunque no haya login, no conviene escribir directamente desde el cliente. La clave publica de Supabase puede acabar expuesta en el navegador, por lo que cualquier mutacion desde cliente seria facil de replicar fuera de la app. Para una app privada, el patron mas seguro y simple es:

1. El cliente llama a rutas backend propias de Vercel.
2. El backend valida, normaliza y ejecuta operaciones con la service role key.
3. Supabase queda protegido frente a escrituras directas desde navegador.

El dominio funcional se limita a fondos indexados por ISIN:

- `funds` guarda el catalogo de fondos soportados.
- `fund_navs` guarda historico de valor liquidativo.
- `transactions` guarda compras, ventas, traspasos y switches.
- `holdings_daily` guarda snapshots diarios recalculados de cartera.
- `imports` e `import_rows` permiten importar desde MyInvestor de forma validada antes de insertar transacciones reales.

## 2. SQL completo para Supabase

Copia y pega este bloque en el SQL Editor de Supabase.

```sql
-- ============================================================
-- Invest - Supabase initial schema
-- App privada sin login, centrada solo en fondos indexados por ISIN.
-- Las escrituras deben hacerse desde backend usando service role.
-- ============================================================

-- UUID generation.
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_fund_isin()
returns trigger
language plpgsql
as $$
begin
  new.isin = upper(trim(new.isin));
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  isin text not null,
  name text not null,
  management_company text,
  currency text not null default 'EUR',
  asset_class text not null default 'equity',
  region text,
  category text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint funds_isin_unique unique (isin),
  constraint funds_isin_format_chk check (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  constraint funds_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint funds_metadata_object_chk check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.fund_navs (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds(id) on delete cascade,
  nav_date date not null,
  nav numeric(20, 8) not null,
  currency text not null default 'EUR',
  source text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint fund_navs_fund_date_unique unique (fund_id, nav_date),
  constraint fund_navs_nav_positive_chk check (nav > 0),
  constraint fund_navs_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint fund_navs_raw_payload_object_chk check (jsonb_typeof(raw_payload) = 'object')
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  base_currency text not null default 'EUR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint accounts_name_provider_unique unique (name, provider),
  constraint accounts_base_currency_chk check (base_currency ~ '^[A-Z]{3}$')
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  import_type text not null,
  source_name text not null,
  original_filename text,
  status text not null default 'pending',
  parsed_rows integer,
  accepted_rows integer,
  rejected_rows integer,
  raw_text text,
  raw_json jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint imports_import_type_chk check (
    import_type in ('manual', 'csv', 'excel', 'image', 'text')
  ),
  constraint imports_status_chk check (
    status in ('pending', 'parsed', 'validated', 'imported', 'failed', 'cancelled')
  ),
  constraint imports_counts_non_negative_chk check (
    coalesce(parsed_rows, 0) >= 0
    and coalesce(accepted_rows, 0) >= 0
    and coalesce(rejected_rows, 0) >= 0
  ),
  constraint imports_raw_json_object_chk check (
    raw_json is null or jsonb_typeof(raw_json) = 'object'
  )
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  fund_id uuid not null references public.funds(id) on delete restrict,
  transaction_type text not null,
  trade_date date not null,
  settlement_date date,
  amount_eur numeric(20, 6) not null,
  nav_used numeric(20, 8),
  shares numeric(24, 10) not null,
  fee_amount numeric(20, 6),
  source text not null default 'manual',
  notes text,
  raw_import_id uuid references public.imports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_type_chk check (
    transaction_type in ('buy', 'sell', 'transfer_in', 'transfer_out', 'switch_in', 'switch_out')
  ),
  constraint transactions_amount_non_negative_chk check (amount_eur >= 0),
  constraint transactions_nav_positive_chk check (nav_used is null or nav_used > 0),
  constraint transactions_shares_positive_chk check (shares > 0),
  constraint transactions_fee_non_negative_chk check (fee_amount is null or fee_amount >= 0),
  constraint transactions_settlement_after_trade_chk check (
    settlement_date is null or settlement_date >= trade_date
  )
);

create table if not exists public.holdings_daily (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  fund_id uuid not null references public.funds(id) on delete cascade,
  holding_date date not null,
  shares numeric(24, 10) not null,
  avg_cost numeric(20, 8) not null,
  invested_amount numeric(20, 6) not null,
  nav numeric(20, 8) not null,
  market_value numeric(20, 6) not null,
  pnl_eur numeric(20, 6) not null,
  pnl_pct numeric(20, 8),
  created_at timestamptz not null default now(),

  constraint holdings_daily_account_fund_date_unique unique (account_id, fund_id, holding_date),
  constraint holdings_daily_shares_non_negative_chk check (shares >= 0),
  constraint holdings_daily_avg_cost_non_negative_chk check (avg_cost >= 0),
  constraint holdings_daily_invested_non_negative_chk check (invested_amount >= 0),
  constraint holdings_daily_nav_positive_chk check (nav > 0),
  constraint holdings_daily_market_value_non_negative_chk check (market_value >= 0)
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports(id) on delete cascade,
  row_index integer not null,
  detected_fund_name text,
  detected_isin text,
  detected_transaction_type text,
  detected_trade_date date,
  detected_amount numeric(20, 6),
  detected_shares numeric(24, 10),
  detected_nav numeric(20, 8),
  confidence numeric(5, 4),
  normalized_json jsonb,
  validation_status text not null default 'pending',
  validation_error text,
  created_at timestamptz not null default now(),

  constraint import_rows_import_row_unique unique (import_id, row_index),
  constraint import_rows_validation_status_chk check (
    validation_status in ('pending', 'valid', 'invalid', 'accepted', 'rejected')
  ),
  constraint import_rows_detected_type_chk check (
    detected_transaction_type is null
    or detected_transaction_type in ('buy', 'sell', 'transfer_in', 'transfer_out', 'switch_in', 'switch_out')
  ),
  constraint import_rows_isin_format_chk check (
    detected_isin is null or upper(detected_isin) ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'
  ),
  constraint import_rows_amount_non_negative_chk check (
    detected_amount is null or detected_amount >= 0
  ),
  constraint import_rows_shares_positive_chk check (
    detected_shares is null or detected_shares > 0
  ),
  constraint import_rows_nav_positive_chk check (
    detected_nav is null or detected_nav > 0
  ),
  constraint import_rows_confidence_range_chk check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint import_rows_normalized_json_object_chk check (
    normalized_json is null or jsonb_typeof(normalized_json) = 'object'
  )
);

create table if not exists public.ai_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  analysis_type text not null,
  input_payload jsonb not null,
  output_payload jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),

  constraint ai_analysis_logs_input_object_chk check (jsonb_typeof(input_payload) = 'object'),
  constraint ai_analysis_logs_output_object_chk check (jsonb_typeof(output_payload) = 'object')
);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------

drop trigger if exists trg_funds_normalize_isin on public.funds;
create trigger trg_funds_normalize_isin
before insert or update of isin on public.funds
for each row execute function public.normalize_fund_isin();

drop trigger if exists trg_funds_updated_at on public.funds;
create trigger trg_funds_updated_at
before update on public.funds
for each row execute function public.set_updated_at();

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_imports_updated_at on public.imports;
create trigger trg_imports_updated_at
before update on public.imports
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

create index if not exists idx_funds_isin on public.funds(isin);
create index if not exists idx_funds_active_category on public.funds(active, category);

create index if not exists idx_fund_navs_fund_nav_date_desc
  on public.fund_navs(fund_id, nav_date desc);
create index if not exists idx_fund_navs_nav_date_desc
  on public.fund_navs(nav_date desc);

create index if not exists idx_transactions_account_trade_date_desc
  on public.transactions(account_id, trade_date desc);
create index if not exists idx_transactions_fund_trade_date_desc
  on public.transactions(fund_id, trade_date desc);
create index if not exists idx_transactions_type
  on public.transactions(transaction_type);
create index if not exists idx_transactions_import
  on public.transactions(raw_import_id);

create index if not exists idx_holdings_daily_holding_date_desc
  on public.holdings_daily(holding_date desc);
create index if not exists idx_holdings_daily_account_holding_date_desc
  on public.holdings_daily(account_id, holding_date desc);
create index if not exists idx_holdings_daily_fund_holding_date_desc
  on public.holdings_daily(fund_id, holding_date desc);
create index if not exists idx_holdings_daily_dashboard
  on public.holdings_daily(holding_date desc, account_id, fund_id);

create index if not exists idx_imports_status_created_at_desc
  on public.imports(status, created_at desc);
create index if not exists idx_import_rows_import_validation
  on public.import_rows(import_id, validation_status);
create index if not exists idx_import_rows_detected_isin
  on public.import_rows(detected_isin);

create index if not exists idx_ai_analysis_logs_type_created_at_desc
  on public.ai_analysis_logs(analysis_type, created_at desc);

-- ------------------------------------------------------------
-- Views for dashboard
-- security_invoker keeps RLS behavior from the calling role.
-- ------------------------------------------------------------

create or replace view public.latest_fund_nav
with (security_invoker = true)
as
select distinct on (fn.fund_id)
  fn.fund_id,
  f.isin,
  f.name,
  fn.nav_date,
  fn.nav,
  fn.currency,
  fn.source,
  fn.created_at
from public.fund_navs fn
join public.funds f on f.id = fn.fund_id
order by fn.fund_id, fn.nav_date desc, fn.created_at desc;

create or replace view public.current_holdings
with (security_invoker = true)
as
select distinct on (hd.account_id, hd.fund_id)
  hd.id,
  hd.account_id,
  a.name as account_name,
  a.provider,
  hd.fund_id,
  f.isin,
  f.name as fund_name,
  f.management_company,
  f.asset_class,
  f.region,
  f.category,
  hd.holding_date,
  hd.shares,
  hd.avg_cost,
  hd.invested_amount,
  hd.nav,
  hd.market_value,
  hd.pnl_eur,
  hd.pnl_pct,
  hd.created_at
from public.holdings_daily hd
join public.accounts a on a.id = hd.account_id
join public.funds f on f.id = hd.fund_id
where a.active = true
  and f.active = true
order by hd.account_id, hd.fund_id, hd.holding_date desc, hd.created_at desc;

create or replace view public.portfolio_summary
with (security_invoker = true)
as
select
  coalesce(sum(ch.market_value), 0)::numeric(20, 6) as total_market_value,
  coalesce(sum(ch.invested_amount), 0)::numeric(20, 6) as total_invested_amount,
  coalesce(sum(ch.pnl_eur), 0)::numeric(20, 6) as total_pnl_eur,
  case
    when coalesce(sum(ch.invested_amount), 0) = 0 then null
    else (sum(ch.pnl_eur) / nullif(sum(ch.invested_amount), 0) * 100)::numeric(20, 8)
  end as total_pnl_pct,
  count(*)::integer as positions_count,
  max(ch.holding_date) as latest_holding_date
from public.current_holdings ch
where ch.shares > 0;

create or replace view public.portfolio_distribution
with (security_invoker = true)
as
select
  ch.fund_id,
  ch.isin,
  ch.fund_name,
  ch.asset_class,
  ch.region,
  ch.category,
  ch.market_value,
  case
    when sum(ch.market_value) over () = 0 then null
    else (ch.market_value / nullif(sum(ch.market_value) over (), 0) * 100)::numeric(20, 8)
  end as portfolio_weight_pct
from public.current_holdings ch
where ch.shares > 0;

create or replace view public.recent_transactions
with (security_invoker = true)
as
select
  t.id,
  t.trade_date,
  t.settlement_date,
  t.transaction_type,
  t.amount_eur,
  t.nav_used,
  t.shares,
  t.fee_amount,
  t.source,
  t.notes,
  t.raw_import_id,
  a.id as account_id,
  a.name as account_name,
  a.provider,
  f.id as fund_id,
  f.isin,
  f.name as fund_name,
  f.asset_class,
  f.region,
  f.category,
  t.created_at,
  t.updated_at
from public.transactions t
join public.accounts a on a.id = t.account_id
join public.funds f on f.id = t.fund_id
order by t.trade_date desc, t.created_at desc;

-- ------------------------------------------------------------
-- RLS strategy
-- ------------------------------------------------------------

alter table public.funds enable row level security;
alter table public.fund_navs enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.holdings_daily enable row level security;
alter table public.imports enable row level security;
alter table public.import_rows enable row level security;
alter table public.ai_analysis_logs enable row level security;

-- No policies are created intentionally.
-- With RLS enabled and no policies, anon/authenticated roles cannot read or write.
-- The backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

revoke all on table public.funds from anon, authenticated;
revoke all on table public.fund_navs from anon, authenticated;
revoke all on table public.accounts from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;
revoke all on table public.holdings_daily from anon, authenticated;
revoke all on table public.imports from anon, authenticated;
revoke all on table public.import_rows from anon, authenticated;
revoke all on table public.ai_analysis_logs from anon, authenticated;

revoke all on public.latest_fund_nav from anon, authenticated;
revoke all on public.current_holdings from anon, authenticated;
revoke all on public.portfolio_summary from anon, authenticated;
revoke all on public.portfolio_distribution from anon, authenticated;
revoke all on public.recent_transactions from anon, authenticated;

-- If later you explicitly want read-only browser access, create narrow SELECT
-- policies and grants only for specific views/tables. Keep writes server-only.

-- ------------------------------------------------------------
-- Seeds
-- ------------------------------------------------------------

insert into public.accounts (name, provider, base_currency, active)
values ('MyInvestor', 'MyInvestor', 'EUR', true)
on conflict (name, provider) do update
set
  base_currency = excluded.base_currency,
  active = excluded.active,
  updated_at = now();

insert into public.funds (
  isin,
  name,
  management_company,
  currency,
  asset_class,
  region,
  category,
  active,
  metadata
)
values
  (
    'IE000ZYRH0Q7',
    'iShares Developed World Index (IE) Acc EUR clase S',
    'iShares',
    'EUR',
    'equity',
    'developed_world',
    'global_developed_index',
    true,
    '{"share_class": "S", "accumulation": true, "index_fund": true}'::jsonb
  ),
  (
    'IE000QAZP7L2',
    'iShares Emerging Markets Index Fund (IE) Acc EUR clase S',
    'iShares',
    'EUR',
    'equity',
    'emerging_markets',
    'emerging_markets_index',
    true,
    '{"share_class": "S", "accumulation": true, "index_fund": true}'::jsonb
  ),
  (
    'IE00B42W3S00',
    'Vanguard Global Small-Cap Index Fund Investor EUR Accumulation',
    'Vanguard',
    'EUR',
    'equity',
    'global',
    'global_small_cap_index',
    true,
    '{"share_class": "Investor", "accumulation": true, "index_fund": true}'::jsonb
  )
on conflict (isin) do update
set
  name = excluded.name,
  management_company = excluded.management_company,
  currency = excluded.currency,
  asset_class = excluded.asset_class,
  region = excluded.region,
  category = excluded.category,
  active = excluded.active,
  metadata = excluded.metadata,
  updated_at = now();
```

## 3. Constraints e indices

El esquema anterior incluye:

- Primary keys UUID en todas las tablas.
- Foreign keys entre NAVs, cuentas, fondos, transacciones, holdings e importaciones.
- Unicidad de `funds.isin`.
- Unicidad de `fund_navs(fund_id, nav_date)`.
- Unicidad de `holdings_daily(account_id, fund_id, holding_date)`.
- Unicidad de `import_rows(import_id, row_index)`.
- Indices para busqueda por ISIN, fechas, cuenta, fondo, importacion y dashboard.

Los indices principales para consultas de dashboard son:

- `idx_fund_navs_fund_nav_date_desc`
- `idx_transactions_account_trade_date_desc`
- `idx_transactions_fund_trade_date_desc`
- `idx_holdings_daily_dashboard`
- `idx_holdings_daily_account_holding_date_desc`
- `idx_holdings_daily_fund_holding_date_desc`

## 4. Tipos permitidos

Se usan `check constraints` en vez de enums PostgreSQL para que sea mas facil ampliar valores en el futuro.

`transactions.transaction_type` permite:

- `buy`
- `sell`
- `transfer_in`
- `transfer_out`
- `switch_in`
- `switch_out`

`imports.import_type` permite:

- `manual`
- `csv`
- `excel`
- `image`
- `text`

`imports.status` permite:

- `pending`
- `parsed`
- `validated`
- `imported`
- `failed`
- `cancelled`

`import_rows.validation_status` permite:

- `pending`
- `valid`
- `invalid`
- `accepted`
- `rejected`

## 5. Triggers

El SQL crea estos triggers:

- `trg_funds_normalize_isin`: normaliza `funds.isin` a mayusculas y sin espacios externos.
- `trg_funds_updated_at`: actualiza `funds.updated_at`.
- `trg_accounts_updated_at`: actualiza `accounts.updated_at`.
- `trg_transactions_updated_at`: actualiza `transactions.updated_at`.
- `trg_imports_updated_at`: actualiza `imports.updated_at`.

No hay trigger para recalcular cartera dentro de PostgreSQL. La recomendacion es recalcular `holdings_daily` desde backend cuando cambien NAVs o transacciones, porque la logica de cartera puede crecer y conviene mantenerla versionada en la aplicacion.

## 6. Vistas utiles para el dashboard

El SQL crea:

- `latest_fund_nav`: ultimo NAV disponible por fondo.
- `current_holdings`: ultima posicion disponible por cuenta y fondo.
- `portfolio_summary`: valor total, invertido total, PnL total y numero de posiciones.
- `portfolio_distribution`: peso de cada fondo en la cartera.
- `recent_transactions`: transacciones recientes con datos de cuenta y fondo.

Las vistas usan `security_invoker = true` para respetar RLS del rol llamante. Como no hay politicas para `anon` ni `authenticated`, no quedan expuestas al navegador por defecto.

## 7. RLS y uso privado sin login

Estrategia recomendada:

- RLS activado en todas las tablas.
- Sin politicas para `anon`.
- Sin politicas para `authenticated`.
- Sin escrituras directas desde cliente.
- Sin exponer `SUPABASE_SERVICE_ROLE_KEY` al navegador.
- Todas las operaciones reales pasan por backend en Vercel.

En Vercel:

- Usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` solo si necesitas inicializar cliente publico para operaciones no sensibles.
- Para esta arquitectura privada, preferiblemente centraliza tambien las lecturas en server routes.
- Usa `SUPABASE_SERVICE_ROLE_KEY` solo en codigo servidor.
- Protege rutas privadas de backend con algun secreto interno propio si las llamas desde cron, por ejemplo `CRON_SECRET`, aunque no forme parte del esquema base.

Ejemplo de patron:

1. El navegador llama a `/api/portfolio`.
2. `/api/portfolio` consulta Supabase con service role desde servidor.
3. El navegador recibe solo el JSON necesario para pintar la app.
4. Para importar movimientos, el navegador sube archivo/texto/imagen a `/api/imports`.
5. `/api/imports` valida y escribe en `imports` e `import_rows`.
6. Otra accion backend acepta filas validas y crea `transactions`.

## 8. Seeds iniciales

Los seeds incluidos en el SQL crean:

- Cuenta `MyInvestor`.
- Fondo `IE000ZYRH0Q7`: iShares Developed World Index (IE) Acc EUR clase S.
- Fondo `IE000QAZP7L2`: iShares Emerging Markets Index Fund (IE) Acc EUR clase S.
- Fondo `IE00B42W3S00`: Vanguard Global Small-Cap Index Fund Investor EUR Accumulation.

Los inserts usan `on conflict` para poder reejecutar el SQL sin duplicar la cuenta ni los fondos.

## 9. Flujo de importacion recomendado

### Importacion manual

1. Crear un registro en `imports`:
   - `import_type = 'manual'`
   - `source_name = 'manual'`
   - `status = 'pending'`
2. Crear una o varias filas en `import_rows`.
3. Validar cada fila:
   - ISIN existente en `funds`.
   - Tipo de transaccion permitido.
   - Fecha valida.
   - Importe no negativo.
   - Participaciones positivas.
   - NAV positivo si se informa.
4. Marcar filas como `valid` o `invalid`.
5. Solo las filas aceptadas pasan a `transactions`.

### Importacion desde Excel o CSV de MyInvestor

1. Subir el archivo a una ruta backend, por ejemplo `/api/imports/myinvestor`.
2. Parsear Excel/CSV en servidor.
3. Crear `imports`:
   - `import_type = 'excel'` o `csv`
   - `source_name = 'MyInvestor'`
   - `original_filename`
   - `raw_json` con metadatos del parseo
4. Crear `import_rows` con los campos detectados.
5. Normalizar:
   - Nombres de fondos.
   - ISIN.
   - Tipo de movimiento a `buy`, `sell`, `transfer_in`, `transfer_out`, `switch_in` o `switch_out`.
   - Fechas.
   - Importes.
   - Participaciones.
   - NAV si aparece.
6. Validar contra `funds`.
7. Insertar en `transactions` solo filas aceptadas.
8. Actualizar contadores en `imports`: `parsed_rows`, `accepted_rows`, `rejected_rows` y `status`.

### Importacion desde texto o imagen usando IA

1. Para texto, guardar entrada original en `imports.raw_text`.
2. Para imagen, extraer texto/OCR en backend antes de llamar al modelo, o usar un modelo multimodal si esta disponible.
3. Enviar a Groq una peticion para convertir la entrada a JSON estructurado.
4. Guardar log minimo en `ai_analysis_logs`.
5. Crear `import_rows` con:
   - Campos detectados.
   - `confidence`.
   - `normalized_json`.
6. Validar siempre antes de insertar transacciones reales.

### Enlace entre staging y transacciones reales

`import_rows` representa la fase de staging y validacion. `transactions` representa solo movimientos aceptados.

Cuando una fila se acepta:

- Crear `transactions.raw_import_id = imports.id`.
- Marcar `import_rows.validation_status = 'accepted'`.
- Mantener el detalle original en `import_rows.normalized_json`.

No se guarda `import_row_id` en `transactions` para mantener el esquema simple. Si mas adelante necesitas trazabilidad fila a fila exacta, se puede anadir una columna nullable `raw_import_row_id`.

## 10. IA con Groq

Variables:

- `GROQ_API_KEY` debe vivir solo en variables de entorno de Vercel o entorno local servidor.
- Nunca debe exponerse en el cliente.

Modelos recomendados:

- Analisis de cartera: `llama-3.3-70b-versatile`.
- Extraccion desde texto o imagen: `meta-llama/llama-4-scout-17b-16e-instruct` si esta disponible para vision/multimodal en tu cuenta de Groq.
- Fallback para imagen: OCR previo en backend y despues extraccion textual con un modelo de texto.

Pipeline recomendado para parsing a JSON:

1. Recibir entrada en backend: manual, CSV, Excel, texto o imagen.
2. Convertir la entrada a texto/filas normalizadas.
3. Enviar a Groq un prompt que exija salida JSON estricta.
4. Validar el JSON con un schema en backend antes de tocar la base.
5. Insertar `imports`.
6. Insertar `import_rows`.
7. Marcar filas como `valid` o `invalid`.
8. Aceptar filas validas y crear `transactions`.
9. Recalcular `holdings_daily`.

Forma minima sugerida para la salida JSON de extraccion:

```json
{
  "rows": [
    {
      "fund_name": "string | null",
      "isin": "string | null",
      "transaction_type": "buy | sell | transfer_in | transfer_out | switch_in | switch_out | null",
      "trade_date": "YYYY-MM-DD | null",
      "amount_eur": 0,
      "shares": 0,
      "nav": 0,
      "confidence": 0.0,
      "notes": "string | null"
    }
  ]
}
```

Logs minimos en `ai_analysis_logs`:

- `analysis_type`: por ejemplo `portfolio_analysis`, `import_text_parse`, `import_image_parse`.
- `input_payload`: entrada sanitizada, sin secretos.
- `output_payload`: JSON devuelto o resumen de error estructurado.
- `model`: modelo Groq usado.
- `created_at`: automatico.

No guardes claves API, cabeceras de autenticacion ni imagenes completas en `ai_analysis_logs`.

## 11. Actualizacion de NAV

El valor de cartera debe presentarse como calculado con el ultimo NAV disponible, no como tiempo real real.

Enfoque practico:

- Guardar cada NAV en `fund_navs`.
- Identificar el ultimo NAV por fondo con `latest_fund_nav`.
- Refrescar NAVs automaticamente desde backend con cron jobs de Vercel.
- Recalcular cartera inmediatamente cuando:
  - entra un NAV nuevo;
  - se crea, modifica o elimina una transaccion;
  - se acepta una importacion.
- Guardar el resultado en `holdings_daily`.

Cron recomendado en Vercel:

- Ruta privada: `/api/cron/refresh-navs`.
- Frecuencia: varias veces al dia, segun disponibilidad de la fuente.
- Seguridad: comprobar un header o token tipo `CRON_SECRET`.
- Proceso:
  1. Leer fondos activos de `funds`.
  2. Consultar ultimo NAV disponible por ISIN en la fuente elegida.
  3. Insertar/upsert en `fund_navs` por `(fund_id, nav_date)`.
  4. Recalcular snapshots en `holdings_daily`.

Recalculo recomendado:

- Ordenar transacciones por `trade_date` y `created_at`.
- Aplicar participaciones positivas con signo derivado de `transaction_type`.
- Calcular `shares`, `invested_amount`, `avg_cost`, `market_value`, `pnl_eur` y `pnl_pct`.
- Crear o reemplazar snapshot por `(account_id, fund_id, holding_date)`.

## 12. Variables de entorno

Configura estas variables en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
```

Uso recomendado:

- `NEXT_PUBLIC_SUPABASE_URL`: URL publica del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publica. No usar para mutaciones directas.
- `SUPABASE_SERVICE_ROLE_KEY`: solo servidor. Permite operar aunque RLS este bloqueando cliente.
- `GROQ_API_KEY`: solo servidor. Usada para analisis y extraccion con Groq.

## 13. Resultado final esperado

Con este setup queda preparada una base inicial para Invest:

- Privada.
- Sin login.
- Sin multiusuario.
- Centrada solo en fondos indexados por ISIN.
- Preparada para MyInvestor como fuente principal de movimientos.
- Preparada para importacion manual, texto, imagen, Excel y CSV.
- Preparada para IA con Groq.
- Preparada para NAV no real-time, basado en ultimo valor disponible.
- Preparada para cron jobs desde Vercel.

