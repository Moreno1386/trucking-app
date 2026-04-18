import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  initialTrucks,
  initialDrivers,
  initialInsurances,
  initialCreditCards,
} from '../data/initialData';
import { newId } from '../utils/helpers';

const now = () => new Date().toISOString();

const useFleetStore = create((set, get) => ({
  trucks: [],
  drivers: [],
  trips: [],
  maintenance: [],
  insurances: [],
  creditCards: [],
  turns: [],
  isLoading: false,

  // ── Cargar todos los datos desde Supabase ────────────────────
  fetchAll: async () => {
    set({ isLoading: true });

    // Test de conexión
    const { error: connError } = await supabase.from('drivers').select('count').limit(1);
    if (connError) {
      alert('Error de conexión con Supabase: ' + connError.message);
      set({ isLoading: false });
      return;
    }

    const [t, d, tr, m, i, cc, tu] = await Promise.all([
      supabase.from('trucks').select('*').order('created_at'),
      supabase.from('drivers').select('*').order('created_at'),
      supabase.from('trips').select('*').order('created_at'),
      supabase.from('maintenance').select('*').order('created_at'),
      supabase.from('insurances').select('*').order('created_at'),
      supabase.from('credit_cards').select('*').order('created_at'),
      supabase.from('turns').select('*').order('timestamp'),
    ]);

    const trucks = t.data || [];
    const drivers = d.data || [];

    // Si no hay camiones, insertar datos iniciales
    if (trucks.length === 0) {
      await Promise.allSettled([
        supabase.from('trucks').insert(initialTrucks),
        supabase.from('drivers').insert(initialDrivers),
        supabase.from('insurances').insert(initialInsurances),
        supabase.from('credit_cards').insert(initialCreditCards),
      ]);

      const [t2, d2, i2, cc2] = await Promise.all([
        supabase.from('trucks').select('*').order('created_at'),
        supabase.from('drivers').select('*').order('created_at'),
        supabase.from('insurances').select('*').order('created_at'),
        supabase.from('credit_cards').select('*').order('created_at'),
      ]);

      set({
        trucks: t2.data || [],
        drivers: d2.data || [],
        trips: tr.data || [],
        maintenance: m.data || [],
        insurances: i2.data || [],
        creditCards: cc2.data || [],
        turns: tu.data || [],
        isLoading: false,
      });
    } else {
      set({
        trucks,
        drivers,
        trips: tr.data || [],
        maintenance: m.data || [],
        insurances: i.data || [],
        creditCards: cc.data || [],
        turns: tu.data || [],
        isLoading: false,
      });
    }
  },

  // ── Tiempo real (Supabase Realtime) ──────────────────────────
  subscribeToRealtime: () => {
    const refresh = async (table, key, orderBy = 'created_at') => {
      const { data } = await supabase.from(table).select('*').order(orderBy);
      if (data) set({ [key]: data });
    };

    const channel = supabase
      .channel('realtime-fleet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' },
        () => refresh('trucks', 'trucks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' },
        () => refresh('drivers', 'drivers'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' },
        () => refresh('trips', 'trips'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' },
        () => refresh('maintenance', 'maintenance'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insurances' },
        () => refresh('insurances', 'insurances'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' },
        () => refresh('credit_cards', 'creditCards'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turns' },
        () => refresh('turns', 'turns', 'timestamp'))
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // ── Trucks ───────────────────────────────────────────────────
  addTruck: async (data) => {
    const truck = { ...data, id: newId(), created_at: now(), updated_at: now() };
    const { error } = await supabase.from('trucks').insert(truck);
    if (error) { alert('Error al guardar camión: ' + error.message); return false; }
    set((s) => ({ trucks: [...s.trucks, truck] }));
    return true;
  },
  updateTruck: async (id, data) => {
    const updated = { ...data, updated_at: now() };
    const { error } = await supabase.from('trucks').update(updated).eq('id', id);
    if (error) { alert('Error al actualizar camión: ' + error.message); return; }
    set((s) => ({ trucks: s.trucks.map((t) => (t.id === id ? { ...t, ...updated } : t)) }));
  },
  deleteTruck: async (id) => {
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (error) { alert('Error al eliminar camión: ' + error.message); return; }
    set((s) => ({ trucks: s.trucks.filter((t) => t.id !== id) }));
  },

  // ── Drivers ──────────────────────────────────────────────────
  addDriver: async (data) => {
    const driver = { ...data, id: newId(), created_at: now() };
    const { error } = await supabase.from('drivers').insert(driver);
    if (error) {
      alert('Error al guardar chofer: ' + error.message);
      return false;
    }
    set((s) => ({ drivers: [...s.drivers, driver] }));
    return true;
  },
  updateDriver: async (id, data) => {
    const { error } = await supabase.from('drivers').update(data).eq('id', id);
    if (error) { alert('Error al actualizar: ' + error.message); return; }
    set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...data } : d)) }));
  },
  deleteDriver: async (id) => {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
  },

  // ── Trips ────────────────────────────────────────────────────
  addTrip: async (data) => {
    const trip = { ...data, id: newId(), created_at: now() };
    const { error } = await supabase.from('trips').insert(trip);
    if (error) { alert('Error al guardar viaje: ' + error.message); return false; }
    set((s) => ({ trips: [...s.trips, trip] }));
    return true;
  },
  updateTrip: async (id, data) => {
    const { error } = await supabase.from('trips').update(data).eq('id', id);
    if (error) { alert('Error al actualizar viaje: ' + error.message); return; }
    set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
  },
  deleteTrip: async (id) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) { alert('Error al eliminar viaje: ' + error.message); return; }
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
  },

  // ── Maintenance ──────────────────────────────────────────────
  addMaintenance: async (data) => {
    const record = { ...data, id: newId(), created_at: now() };
    const { error } = await supabase.from('maintenance').insert(record);
    if (error) { alert('Error al guardar mantenimiento: ' + error.message); return false; }
    set((s) => ({ maintenance: [...s.maintenance, record] }));
    return true;
  },
  updateMaintenance: async (id, data) => {
    const { error } = await supabase.from('maintenance').update(data).eq('id', id);
    if (error) { alert('Error al actualizar mantenimiento: ' + error.message); return; }
    set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...data } : m)) }));
  },
  deleteMaintenance: async (id) => {
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    if (error) { alert('Error al eliminar mantenimiento: ' + error.message); return; }
    set((s) => ({ maintenance: s.maintenance.filter((m) => m.id !== id) }));
  },

  // ── Insurances ───────────────────────────────────────────────
  addInsurance: async (data) => {
    const ins = { ...data, id: newId(), created_at: now() };
    const { error } = await supabase.from('insurances').insert(ins);
    if (error) { alert('Error al guardar seguro: ' + error.message); return false; }
    set((s) => ({ insurances: [...s.insurances, ins] }));
    return true;
  },
  updateInsurance: async (id, data) => {
    const { error } = await supabase.from('insurances').update(data).eq('id', id);
    if (error) { alert('Error al actualizar seguro: ' + error.message); return; }
    set((s) => ({ insurances: s.insurances.map((i) => (i.id === id ? { ...i, ...data } : i)) }));
  },
  deleteInsurance: async (id) => {
    const { error } = await supabase.from('insurances').delete().eq('id', id);
    if (error) { alert('Error al eliminar seguro: ' + error.message); return; }
    set((s) => ({ insurances: s.insurances.filter((i) => i.id !== id) }));
  },

  // ── Credit Cards ─────────────────────────────────────────────
  addCreditCard: async (data) => {
    const card = { ...data, id: newId(), created_at: now() };
    const { error } = await supabase.from('credit_cards').insert(card);
    if (error) { alert('Error al guardar tarjeta: ' + error.message); return false; }
    set((s) => ({ creditCards: [...s.creditCards, card] }));
    return true;
  },
  updateCreditCard: async (id, data) => {
    const { error } = await supabase.from('credit_cards').update(data).eq('id', id);
    if (error) { alert('Error al actualizar tarjeta: ' + error.message); return; }
    set((s) => ({ creditCards: s.creditCards.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
  },
  deleteCreditCard: async (id) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) { alert('Error al eliminar tarjeta: ' + error.message); return; }
    set((s) => ({ creditCards: s.creditCards.filter((c) => c.id !== id) }));
  },

  // ── Dispatch / Turns ─────────────────────────────────────────
  addToTurnList: async (driverId) => {
    const { turns } = get();
    const already = turns.some((t) => t.driver_id === driverId && t.estado === 'esperando');
    if (already) return;
    const turn = { id: newId(), driver_id: driverId, timestamp: now(), estado: 'esperando' };
    set((s) => ({ turns: [...s.turns, turn] }));
    await supabase.from('turns').insert(turn);
  },
  removeFromTurnList: async (turnId) => {
    set((s) => ({ turns: s.turns.filter((t) => t.id !== turnId) }));
    await supabase.from('turns').delete().eq('id', turnId);
  },
  assignNextTrip: async () => {
    const { turns } = get();
    const pending = turns
      .filter((t) => t.estado === 'esperando')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (!pending.length) return null;
    const next = pending[0];
    set((s) => ({ turns: s.turns.map((t) => (t.id === next.id ? { ...t, estado: 'asignado' } : t)) }));
    await supabase.from('turns').update({ estado: 'asignado' }).eq('id', next.id);
    return next.driver_id;
  },
  markDriverUnavailable: async (driverId) => {
    const { turns } = get();
    const turn = turns.find((t) => t.driver_id === driverId && t.estado === 'esperando');
    if (turn) {
      set((s) => ({ turns: s.turns.filter((t) => t.id !== turn.id) }));
      await supabase.from('turns').delete().eq('id', turn.id);
    }
  },

  // ── Computed ─────────────────────────────────────────────────
  getStats: () => {
    const { trucks, drivers } = get();
    return {
      totalCamiones: trucks.length,
      disponibles: trucks.filter((t) => t.estado === 'disponible').length,
      enViaje: trucks.filter((t) => t.estado === 'en_viaje').length,
      mantenimiento: trucks.filter((t) => t.estado === 'mantenimiento').length,
      choferesActivos: drivers.filter((d) => d.estado === 'activo').length,
    };
  },

  getAlerts: () => {
    const { trucks, drivers, insurances, creditCards } = get();
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    trucks.forEach((truck) => {
      const kmSince = truck.kilometraje_actual - truck.ultimo_cambio_aceite;
      const interval = truck.intervalo_cambio_aceite || 10000;
      const remaining = interval - kmSince;
      if (remaining <= 0) {
        alerts.push({
          id: `oil-overdue-${truck.id}`,
          type: 'oil_overdue',
          severity: 'high',
          titulo: 'Cambio de aceite VENCIDO',
          mensaje: `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo} ${truck.anio}`,
          detalle: `Vencido por ${Math.abs(remaining).toLocaleString('es-MX')} km`,
        });
      } else if (remaining <= 2000) {
        alerts.push({
          id: `oil-soon-${truck.id}`,
          type: 'oil_soon',
          severity: 'medium',
          titulo: 'Cambio de aceite próximo',
          mensaje: `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo} ${truck.anio}`,
          detalle: `Faltan ${remaining.toLocaleString('es-MX')} km`,
        });
      }
    });

    drivers.forEach((driver) => {
      if (!driver.licencia_vencimiento) return;
      const exp = new Date(driver.licencia_vencimiento + 'T12:00:00');
      const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      const fullName = `${driver.nombre} ${driver.apellido_paterno} ${driver.apellido_materno || ''}`.trim();
      if (days < 0) {
        alerts.push({
          id: `lic-expired-${driver.id}`,
          type: 'license_expired',
          severity: 'high',
          titulo: 'Licencia VENCIDA',
          mensaje: fullName,
          detalle: `${driver.numero_empleado} — Venció el ${exp.toLocaleDateString('es-MX')}`,
        });
      } else if (days <= 30) {
        alerts.push({
          id: `lic-soon-${driver.id}`,
          type: 'license_soon',
          severity: 'medium',
          titulo: 'Licencia próxima a vencer',
          mensaje: fullName,
          detalle: `${driver.numero_empleado} — Vence en ${days} días`,
        });
      }
    });

    // ── Seguros ──────────────────────────────────────────────────
    insurances.forEach((ins) => {
      if (!ins.fecha_vencimiento || ins.estado !== 'activo') return;
      const exp = new Date(ins.fecha_vencimiento + 'T12:00:00');
      const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (days < 0) {
        alerts.push({
          id: `ins-expired-${ins.id}`,
          type: 'insurance_expired',
          severity: 'high',
          titulo: 'Póliza de seguro VENCIDA',
          mensaje: `${ins.aseguradora} — Póliza ${ins.numero_poliza}`,
          detalle: `Venció el ${exp.toLocaleDateString('es-MX')}`,
        });
      } else if (days <= 30) {
        alerts.push({
          id: `ins-soon-${ins.id}`,
          type: 'insurance_soon',
          severity: 'medium',
          titulo: 'Póliza próxima a vencer',
          mensaje: `${ins.aseguradora} — Póliza ${ins.numero_poliza}`,
          detalle: `Vence en ${days} días (${exp.toLocaleDateString('es-MX')})`,
        });
      }
    });

    // ── Tarjetas de crédito ───────────────────────────────────────
    creditCards.forEach((card) => {
      if (!card.dia_pago) return;
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      let dueDate;
      if (card.dia_pago >= currentDay) {
        dueDate = new Date(currentYear, currentMonth, card.dia_pago);
      } else {
        dueDate = new Date(currentYear, currentMonth + 1, card.dia_pago);
      }
      const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const last4 = String(card.numero_tarjeta).slice(-4);
      if (days === 0) {
        alerts.push({
          id: `card-today-${card.id}`,
          type: 'card_due_today',
          severity: 'high',
          titulo: 'Pago de tarjeta HOY',
          mensaje: `${card.banco} ${card.tipo} ****${last4}`,
          detalle: `Saldo: $${Number(card.saldo).toLocaleString('es-MX')}`,
        });
      } else if (days <= 5) {
        alerts.push({
          id: `card-soon-${card.id}`,
          type: 'card_due_soon',
          severity: 'medium',
          titulo: 'Pago de tarjeta próximo',
          mensaje: `${card.banco} ${card.tipo} ****${last4}`,
          detalle: `Vence en ${days} días — Saldo: $${Number(card.saldo).toLocaleString('es-MX')}`,
        });
      }
    });

    return alerts;
  },
}));

export default useFleetStore;
