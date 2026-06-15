-- ═══════════════════════════════════════════════════
-- CHAIRES TRUCKING — Mensualidades de Vehículos
-- Ejecutar en: Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════

create table if not exists mensualidades_vehiculos (
  id text primary key,
  vehiculo text not null,
  camion_id text,
  pago_mensual numeric default 0,
  dia_pago integer,
  total_mensualidades integer,
  mensualidades_pagadas integer default 0,
  estado text default 'activo',
  notas text,
  created_at text
);

alter table mensualidades_vehiculos disable row level security;

-- Realtime
alter publication supabase_realtime add table mensualidades_vehiculos;

-- Vehículos iniciales
insert into mensualidades_vehiculos (id, vehiculo, pago_mensual, estado, created_at) values
  (gen_random_uuid()::text, 'Unidad 12-78BA9V — Kenworth T680', 73753.57, 'activo', now()::text),
  (gen_random_uuid()::text, 'Unidad 11-58AZ3W — VOLKSWAGEN DELIVERY', 38668.41, 'activo', now()::text),
  (gen_random_uuid()::text, 'Unidad 16-91BK4L — FREIGHTLINER M2', 50340.90, 'activo', now()::text);
