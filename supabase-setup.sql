-- Chaires Trucking - Crear tablas en Supabase
-- Corre este script en: Supabase → SQL Editor → New query

create table if not exists trucks (
  id text primary key,
  numero_unidad text,
  marca text,
  modelo text,
  año integer,
  placa text,
  vin text,
  capacidad_carga numeric,
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

create table if not exists drivers (
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

create table if not exists trips (
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
  distancia_km numeric,
  costo numeric,
  estado text default 'pendiente',
  notas text,
  created_at text
);

create table if not exists maintenance (
  id text primary key,
  camion_id text,
  tipo text,
  descripcion text,
  fecha text,
  taller text,
  costo numeric,
  kilometraje_al_servicio numeric,
  proximo_servicio_km numeric,
  estado text default 'pendiente',
  notas text,
  created_at text
);

create table if not exists insurances (
  id text primary key,
  aseguradora text,
  numero_poliza text,
  camion_id text,
  tipo_cobertura text,
  fecha_inicio text,
  fecha_vencimiento text,
  prima_anual numeric,
  suma_asegurada numeric,
  estado text default 'activo',
  notas text,
  created_at text
);

create table if not exists credit_cards (
  id text primary key,
  titular text,
  numero_tarjeta text,
  banco text,
  tipo text,
  limite numeric,
  saldo numeric,
  dia_corte integer,
  dia_pago integer,
  notas text,
  created_at text
);

create table if not exists turns (
  id text primary key,
  driver_id text,
  timestamp text,
  estado text default 'esperando'
);

-- Deshabilitar seguridad por fila (app privada)
alter table trucks disable row level security;
alter table drivers disable row level security;
alter table trips disable row level security;
alter table maintenance disable row level security;
alter table insurances disable row level security;
alter table credit_cards disable row level security;
alter table turns disable row level security;
