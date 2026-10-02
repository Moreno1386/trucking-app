-- ============================================================
-- CHAIRES TRUCKING — Tabla NUEVA: Histórico de Viajes (2020 en adelante)
-- Solo crea una tabla nueva. No modifica ninguna tabla existente.
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

create table if not exists viajes_historicos (
  id               bigint generated always as identity primary key,
  anio             int  not null,
  orden            int,             -- posición original en el Excel de ese año
  fecha            text,            -- YYYY-MM-DD (o el texto original si venía mal escrita)
  destino          text,
  operador         text,
  unidad           text,
  costo_real       numeric,
  costo_servicio   numeric,
  diesel           numeric,
  casetas_efectivo numeric,
  casetas_televia  numeric,
  casetas_iave     numeric,
  otros_gastos     numeric,
  prestamos        numeric,
  abonos           numeric,
  pago_operador    numeric,
  utilidad         numeric,
  utilidad_real    numeric,
  fuente           text,            -- archivo de donde salió
  created_at       timestamptz default now()
);

create index if not exists viajes_historicos_anio_idx on viajes_historicos (anio, orden);

-- Misma seguridad que el resto de las tablas: solo usuarios con sesión
alter table viajes_historicos enable row level security;

create policy "usuarios_autenticados" on viajes_historicos
  for all to authenticated using (true) with check (true);
