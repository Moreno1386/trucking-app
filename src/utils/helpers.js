export const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatNumber = (n) =>
  new Intl.NumberFormat('es-MX').format(n || 0);

export const statusLabel = {
  disponible: 'Disponible',
  en_viaje: 'En Viaje',
  mantenimiento: 'Mantenimiento',
  activo: 'Activo',
  inactivo: 'Inactivo',
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  en_curso: 'En Curso',
};

export const statusClass = (estado) => {
  const map = {
    disponible: 'bg-green-100 text-green-800',
    en_viaje: 'bg-blue-100 text-blue-800',
    mantenimiento: 'bg-yellow-100 text-yellow-800',
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-gray-100 text-gray-600',
    pendiente: 'bg-yellow-100 text-yellow-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
    en_curso: 'bg-blue-100 text-blue-800',
  };
  return map[estado] || 'bg-gray-100 text-gray-700';
};

export const getOilStatus = (truck) => {
  const kmSince = truck.kilometraje_actual - truck.ultimo_cambio_aceite;
  const interval = truck.intervalo_cambio_aceite || 10000;
  const remaining = interval - kmSince;
  const pct = Math.min((kmSince / interval) * 100, 100);
  if (remaining <= 0) return { status: 'vencido', remaining: Math.abs(remaining), pct: 100, color: 'red' };
  if (remaining <= 2000) return { status: 'proximo', remaining, pct, color: 'yellow' };
  return { status: 'ok', remaining, pct, color: 'green' };
};

export const getDaysRemaining = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr + 'T12:00:00');
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
};

export const daysRemainingClass = (days) => {
  if (days === null) return 'bg-gray-100 text-gray-600';
  if (days < 0) return 'bg-red-100 text-red-800';
  if (days <= 30) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const maskCard = (num) => {
  const clean = (num || '').replace(/\s/g, '');
  if (clean.length < 8) return num;
  return clean.slice(0, 4) + ' **** **** ' + clean.slice(-4);
};

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
