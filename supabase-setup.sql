-- ═══════════════════════════════════════════════════
-- CHAIRES TRUCKING — Esquema completo de Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════

drop table if exists turns;
drop table if exists credit_cards;
drop table if exists insurances;
drop table if exists maintenance;
drop table if exists trips;
drop table if exists drivers;
drop table if exists trucks;

-- TRUCKS
create table trucks (
  id text primary key,
  numero_unidad text,
  marca text,
  modelo text,
  anio integer,
  placa text,
  vin text,
  capacidad_carga numeric default 0,
  kilometraje_actual numeric default 0,
  estado text default 'disponible',
  ultimo_cambio_aceite numeric default 0,
  intervalo_cambio_aceite numeric default 10000,
  fecha_ultimo_mantenimiento text,
  foto_url text,
  notas text,
  created_at text,
  updated_at text
);

-- DRIVERS
create table drivers (
  id text primary key,
  numero_empleado text,
  nombre text,
  apellido_paterno text,
  apellido_materno text,
  licencia_numero text,
  licencia_tipo text default 'B',
  licencia_vencimiento text,
  telefono text,
  email text,
  direccion text,
  fecha_nacimiento text,
  fecha_ingreso text,
  estado text default 'activo',
  foto_url text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  notas text,
  created_at text,
  updated_at text
);

-- TRIPS
create table trips (
  id text primary key,
  numero_viaje text,
  camion_id text,
  chofer_id text,
  origen text,
  destino text,
  cliente text,
  fecha_salida text,
  fecha_llegada_estimada text,
  fecha_llegada_real text,
  distancia_km numeric default 0,
  costo numeric default 0,
  estado text default 'pendiente',
  notas text,
  created_at text
);

-- MAINTENANCE
create table maintenance (
  id text primary key,
  camion_id text,
  tipo text,
  descripcion text,
  fecha text,
  taller text,
  costo numeric default 0,
  kilometraje_al_servicio numeric default 0,
  proximo_servicio_km numeric default 0,
  estado text default 'pendiente',
  notas text,
  created_at text
);

-- INSURANCES
create table insurances (
  id text primary key,
  aseguradora text,
  numero_poliza text,
  camion_id text,
  tipo_cobertura text,
  fecha_inicio text,
  fecha_vencimiento text,
  prima_anual numeric default 0,
  suma_asegurada numeric default 0,
  estado text default 'activo',
  notas text,
  created_at text
);

-- CREDIT CARDS
create table credit_cards (
  id text primary key,
  titular text,
  numero_tarjeta text,
  banco text,
  tipo text,
  limite numeric default 0,
  saldo numeric default 0,
  dia_corte integer,
  dia_pago integer,
  notas text,
  created_at text
);

-- TURNS (despacho FIFO)
create table turns (
  id text primary key,
  driver_id text,
  timestamp text,
  estado text default 'esperando'
);

-- Deshabilitar Row Level Security (app privada sin auth de usuarios)
alter table trucks disable row level security;
alter table drivers disable row level security;
alter table trips disable row level security;
alter table maintenance disable row level security;
alter table insurances disable row level security;
alter table credit_cards disable row level security;
alter table turns disable row level security;
