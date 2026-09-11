export const fmt = n => new Intl.NumberFormat('es-MX').format(n)
export const types = { tractor: 'Tractocamión', medium: 'Torton', light: 'Camión ligero', van: 'Van', pickup: 'Pickup' }
export const statuses = {
  ok: { label: 'Sin alerta', color: '#22c55e', name: 'green' },
  proximo: { label: 'Aceite próximo', color: '#eab308', name: 'yellow' },
  vencido: { label: 'Aceite vencido', color: '#ef4444', name: 'red' },
}

// Same arithmetic and boundaries as useFleetStore.getAlerts and helpers.getOilStatus.
// The cron uses (value || 0) for odometers. For supplied finite numbers they agree.
// Keep the source arithmetic (including negative kmSince) separate from data warnings.
export function getOilStatus(truck) {
  const kmSince = truck.kilometraje_actual - truck.ultimo_cambio_aceite
  const interval = truck.intervalo_cambio_aceite || 10000
  const remaining = interval - kmSince
  const pct = Math.min((kmSince / interval) * 100, 100)
  const status = remaining <= 0 ? 'vencido' : remaining <= 2000 ? 'proximo' : 'ok'
  return { kmSince, interval, remaining, pct, status, next: truck.ultimo_cambio_aceite + interval }
}

export function inspectData(truck) {
  const issues = []
  if (!Number.isFinite(truck.kilometraje_actual) || !Number.isFinite(truck.ultimo_cambio_aceite)) issues.push('Falta un kilometraje válido para calcular el aceite.')
  if (truck.kilometraje_actual < truck.ultimo_cambio_aceite) issues.push(`El odómetro (${fmt(truck.kilometraje_actual)} km) es menor al último cambio (${fmt(truck.ultimo_cambio_aceite)} km). Confirma ambos registros.`)
  if (truck.kilometraje_actual < 0 || truck.ultimo_cambio_aceite < 0) issues.push('Hay un kilometraje negativo; revisa el registro.')
  if (truck.intervalo_cambio_aceite < 0) issues.push('El intervalo de aceite debe ser positivo.')
  return issues
}

export function identify(truck) {
  const unit = String(truck.numero_unidad).trim().match(/^\d+/)?.[0] || String(truck.numero_unidad).trim()
  const text = `${truck.marca} ${truck.modelo}`.toLowerCase()
  if (/sprinter|transporter/.test(text)) return { unit, kind: 'van', variant: text.includes('sprinter') ? 'sprinter' : 'transporter' }
  if (/l200/.test(text)) return { unit, kind: 'pickup', variant: 'l200' }
  if (/t680|peterbilt|cascadia/.test(text)) return { unit, kind: 'tractor', variant: /peterbilt/.test(text) ? 'peterbilt' : /t680/.test(text) ? 't680' : 'cascadia' }
  if (/delivery/.test(text)) return { unit, kind: 'light', variant: 'delivery' }
  if (/m2|international|constellation/.test(text)) return { unit, kind: 'medium', variant: /constellation/.test(text) ? 'constellation' : /international/.test(text) ? 'international' : 'm2' }
  return { unit, kind: 'unknown', variant: 'unknown' }
}

const arrangement = ['12', '13', '17', '04', '07', '08', '15', '16', '10', '11', '18', '01', '09', 'PILOTO']
export function prepareFleet(records) {
  return records.map((record, i) => {
    const identity = identify(record)
    const slot = arrangement.indexOf(identity.unit)
    const index = slot < 0 ? i : slot
    const zone = index < 7 ? 'A' : 'B'
    return { ...record, ...identity, id: record.id ?? `${identity.unit}-${String(record.placa).trim()}`, plate: String(record.placa || '').trim(), oil: getOilStatus(record), issues: inspectData(record), zone, bay: `${zone}-${index % 7 + 1}`, position: [(index % 7 - 3) * 6.3, 0, zone === 'A' ? -9 : 9], color: ['11','13','07','18','PILOTO'].includes(identity.unit) ? '#b91c1c' : '#f4f3ed' }
  })
}

export const priority = t => t.issues.length ? 1 : t.oil.status === 'vencido' ? 0 : t.oil.status === 'proximo' ? 2 : 3
export const sortPriority = (a, b) => priority(a) - priority(b) || a.oil.remaining - b.oil.remaining
export function oilText(t) { return t.oil.remaining <= 0 ? `Vencido por ${fmt(Math.abs(t.oil.remaining))} km` : `Faltan ${fmt(t.oil.remaining)} km` }
export function tripImpact(t, km) {
  if (t.issues.length || !Number.isFinite(t.oil.remaining)) return { kind: 'review', label: 'Revisar datos primero' }
  const remaining = t.oil.remaining - km
  if (remaining <= 0) return { kind: 'vencido', label: `Al regreso: vencido por ${fmt(-remaining)} km` }
  return { kind: remaining <= 2000 ? 'proximo' : 'ok', label: `Al regreso: ${fmt(remaining)} km para aceite` }
}

export function csvReport(fleet) {
  const cell = v => `"${(typeof v === 'number' ? String(v) : String(v ?? '').replace(/^[=+@-]/, "'$&")).replaceAll('"', '""')}"`
  const rows = [['Unidad', 'Placa', 'Marca', 'Modelo', 'Año', 'Kilometraje', 'Último aceite km', 'Intervalo km', 'Próximo aceite km', 'Km restantes (negativo=vencido)', 'Alerta aceite', 'Revisar datos', 'Estado registrado'], ...[...fleet].sort(sortPriority).map(t => [t.unit,t.plate,t.marca,t.modelo,t.anio,t.kilometraje_actual,t.ultimo_cambio_aceite,t.oil.interval,t.oil.next,t.oil.remaining,statuses[t.oil.status].label,t.issues.join(' '),t.estado])]
  return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n')
}
