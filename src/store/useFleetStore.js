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
    try {
      const [
        { data: trucks },
        { data: drivers },
        { data: trips },
        { data: maintenance },
        { data: insurances },
        { data: creditCards },
        { data: turns },
      ] = await Promise.all([
        supabase.from('trucks').select('*').order('created_at'),
        supabase.from('drivers').select('*').order('created_at'),
        supabase.from('trips').select('*').order('created_at'),
        supabase.from('maintenance').select('*').order('created_at'),
        supabase.from('insurances').select('*').order('created_at'),
        supabase.from('credit_cards').select('*').order('created_at'),
        supabase.from('turns').select('*').order('timestamp'),
      ]);

      // Si las tablas están vacías, cargar datos iniciales
      const trucksData = trucks?.length ? trucks : [];
      const driversData = drivers?.length ? drivers : [];
      const insurancesData = insurances?.length ? insurances : [];
      const creditCardsData = creditCards?.length ? creditCards : [];

      if (!trucks?.length) await get().seedInitialData();

      set({
        trucks: trucksData,
        drivers: driversData,
        trips: trips || [],
        maintenance: maintenance || [],
        insurances: insurancesData,
        creditCards: creditCardsData,
        turns: turns || [],
        isLoading: false,
      });

      // Re-fetch después de seed
      if (!trucks?.length) {
        const { data: t } = await supabase.from('trucks').select('*').order('created_at');
        const { data: d } = await supabase.from('drivers').select('*').order('created_at');
        const { data: i } = await supabase.from('insurances').select('*').order('created_at');
        const { data: cc } = await supabase.from('credit_cards').select('*').order('created_at');
        set({ trucks: t || [], drivers: d || [], insurances: i || [], creditCards: cc || [] });
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      set({ isLoading: false });
    }
  },

  // ── Insertar datos iniciales si las tablas están vacías ──────
  seedInitialData: async () => {
    await Promise.all([
      supabase.from('trucks').insert(initialTrucks),
      supabase.from('drivers').insert(initialDrivers),
      supabase.from('insurances').insert(initialInsurances),
      supabase.from('credit_cards').insert(initialCreditCards),
    ]);
  },

  // ── Trucks ───────────────────────────────────────────────────
  addTruck: async (data) => {
    const truck = { ...data, id: newId(), created_at: now(), updated_at: now() };
    set((s) => ({ trucks: [...s.trucks, truck] }));
    await supabase.from('trucks').insert(truck);
  },
  updateTruck: async (id, data) => {
    const updated = { ...data, updated_at: now() };
    set((s) => ({
      trucks: s.trucks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
    await supabase.from('trucks').update(updated).eq('id', id);
  },
  deleteTruck: async (id) => {
    set((s) => ({ trucks: s.trucks.filter((t) => t.id !== id) }));
    await supabase.from('trucks').delete().eq('id', id);
  },

  // ── Drivers ──────────────────────────────────────────────────
  addDriver: async (data) => {
    const driver = { ...data, id: newId(), created_at: now() };
    set((s) => ({ drivers: [...s.drivers, driver] }));
    await supabase.from('drivers').insert(driver);
  },
  updateDriver: async (id, data) => {
    set((s) => ({
      drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...data, updated_at: now() } : d)),
    }));
    await supabase.from('drivers').update({ ...data, updated_at: now() }).eq('id', id);
  },
  deleteDriver: async (id) => {
    set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
    await supabase.from('drivers').delete().eq('id', id);
  },

  // ── Trips ────────────────────────────────────────────────────
  addTrip: async (data) => {
    const trip = { ...data, id: newId(), created_at: now() };
    set((s) => ({ trips: [...s.trips, trip] }));
    await supabase.from('trips').insert(trip);
  },
  updateTrip: async (id, data) => {
    set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
    await supabase.from('trips').update(data).eq('id', id);
  },
  deleteTrip: async (id) => {
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
    await supabase.from('trips').delete().eq('id', id);
  },

  // ── Maintenance ──────────────────────────────────────────────
  addMaintenance: async (data) => {
    const record = { ...data, id: newId(), created_at: now() };
    set((s) => ({ maintenance: [...s.maintenance, record] }));
    await supabase.from('maintenance').insert(record);
  },
  updateMaintenance: async (id, data) => {
    set((s) => ({
      maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
    await supabase.from('maintenance').update(data).eq('id', id);
  },
  deleteMaintenance: async (id) => {
    set((s) => ({ maintenance: s.maintenance.filter((m) => m.id !== id) }));
    await supabase.from('maintenance').delete().eq('id', id);
  },

  // ── Insurances ───────────────────────────────────────────────
  addInsurance: async (data) => {
    const ins = { ...data, id: newId(), created_at: now() };
    set((s) => ({ insurances: [...s.insurances, ins] }));
    await supabase.from('insurances').insert(ins);
  },
  updateInsurance: async (id, data) => {
    set((s) => ({
      insurances: s.insurances.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
    await supabase.from('insurances').update(data).eq('id', id);
  },
  deleteInsurance: async (id) => {
    set((s) => ({ insurances: s.insurances.filter((i) => i.id !== id) }));
    await supabase.from('insurances').delete().eq('id', id);
  },

  // ── Credit Cards ─────────────────────────────────────────────
  addCreditCard: async (data) => {
    const card = { ...data, id: newId(), created_at: now() };
    set((s) => ({ creditCards: [...s.creditCards, card] }));
    await supabase.from('credit_cards').insert(card);
  },
  updateCreditCard: async (id, data) => {
    set((s) => ({
      creditCards: s.creditCards.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    await supabase.from('credit_cards').update(data).eq('id', id);
  },
  deleteCreditCard: async (id) => {
    set((s) => ({ creditCards: s.creditCards.filter((c) => c.id !== id) }));
    await supabase.from('credit_cards').delete().eq('id', id);
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
    set((s) => ({
      turns: s.turns.map((t) => (t.id === next.id ? { ...t, estado: 'asignado' } : t)),
    }));
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
    const { trucks, drivers } = get();
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
          mensaje: `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo} ${truck.año}`,
          detalle: `Vencido por ${Math.abs(remaining).toLocaleString('es-MX')} km`,
        });
      } else if (remaining <= 2000) {
        alerts.push({
          id: `oil-soon-${truck.id}`,
          type: 'oil_soon',
          severity: 'medium',
          titulo: 'Cambio de aceite próximo',
          mensaje: `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo} ${truck.año}`,
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

    return alerts;
  },
}));

export default useFleetStore;
