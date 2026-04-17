import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  initialTrucks,
  initialDrivers,
  initialInsurances,
  initialCreditCards,
  initialTrips,
  initialMaintenance,
  initialTurns,
} from '../data/initialData';
import { newId } from '../utils/helpers';

const now = () => new Date().toISOString();

const useFleetStore = create(
  persist(
    (set, get) => ({
      trucks: initialTrucks,
      drivers: initialDrivers,
      trips: initialTrips,
      maintenance: initialMaintenance,
      insurances: initialInsurances,
      creditCards: initialCreditCards,
      turns: initialTurns,
      isLoading: false,

      // ── Trucks ──────────────────────────────────────────────
      addTruck: (data) =>
        set((s) => ({
          trucks: [
            ...s.trucks,
            { ...data, id: newId(), created_at: now(), updated_at: now() },
          ],
        })),
      updateTruck: (id, data) =>
        set((s) => ({
          trucks: s.trucks.map((t) =>
            t.id === id ? { ...t, ...data, updated_at: now() } : t
          ),
        })),
      deleteTruck: (id) =>
        set((s) => ({ trucks: s.trucks.filter((t) => t.id !== id) })),

      // ── Drivers ─────────────────────────────────────────────
      addDriver: (data) =>
        set((s) => ({
          drivers: [...s.drivers, { ...data, id: newId(), created_at: now() }],
        })),
      updateDriver: (id, data) =>
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, ...data, updated_at: now() } : d
          ),
        })),
      deleteDriver: (id) =>
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      // ── Trips ────────────────────────────────────────────────
      addTrip: (data) =>
        set((s) => ({
          trips: [...s.trips, { ...data, id: newId(), created_at: now() }],
        })),
      updateTrip: (id, data) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      deleteTrip: (id) =>
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),

      // ── Maintenance ──────────────────────────────────────────
      addMaintenance: (data) =>
        set((s) => ({
          maintenance: [
            ...s.maintenance,
            { ...data, id: newId(), created_at: now() },
          ],
        })),
      updateMaintenance: (id, data) =>
        set((s) => ({
          maintenance: s.maintenance.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),
      deleteMaintenance: (id) =>
        set((s) => ({
          maintenance: s.maintenance.filter((m) => m.id !== id),
        })),

      // ── Insurances ───────────────────────────────────────────
      addInsurance: (data) =>
        set((s) => ({
          insurances: [
            ...s.insurances,
            { ...data, id: newId(), created_at: now() },
          ],
        })),
      updateInsurance: (id, data) =>
        set((s) => ({
          insurances: s.insurances.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),
      deleteInsurance: (id) =>
        set((s) => ({
          insurances: s.insurances.filter((i) => i.id !== id),
        })),

      // ── Credit Cards ─────────────────────────────────────────
      addCreditCard: (data) =>
        set((s) => ({
          creditCards: [
            ...s.creditCards,
            { ...data, id: newId(), created_at: now() },
          ],
        })),
      updateCreditCard: (id, data) =>
        set((s) => ({
          creditCards: s.creditCards.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      deleteCreditCard: (id) =>
        set((s) => ({
          creditCards: s.creditCards.filter((c) => c.id !== id),
        })),

      // ── Dispatch / Turns ─────────────────────────────────────
      addToTurnList: (driverId) =>
        set((s) => {
          const already = s.turns.some(
            (t) => t.driver_id === driverId && t.estado === 'esperando'
          );
          if (already) return s;
          return {
            turns: [
              ...s.turns,
              {
                id: newId(),
                driver_id: driverId,
                timestamp: now(),
                estado: 'esperando',
              },
            ],
          };
        }),
      removeFromTurnList: (turnId) =>
        set((s) => ({ turns: s.turns.filter((t) => t.id !== turnId) })),
      assignNextTrip: () => {
        const { turns } = get();
        const pending = turns
          .filter((t) => t.estado === 'esperando')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        if (!pending.length) return null;
        const next = pending[0];
        set((s) => ({
          turns: s.turns.map((t) =>
            t.id === next.id ? { ...t, estado: 'asignado' } : t
          ),
        }));
        return next.driver_id;
      },
      markDriverAvailable: (driverId) => {
        const { addToTurnList } = get();
        addToTurnList(driverId);
      },
      markDriverUnavailable: (driverId) =>
        set((s) => ({
          turns: s.turns.filter(
            (t) => !(t.driver_id === driverId && t.estado === 'esperando')
          ),
        })),

      // ── Computed helpers (called from components) ────────────
      getStats: () => {
        const { trucks, drivers } = get();
        return {
          totalCamiones: trucks.length,
          disponibles: trucks.filter((t) => t.estado === 'disponible').length,
          enViaje: trucks.filter((t) => t.estado === 'en_viaje').length,
          mantenimiento: trucks.filter((t) => t.estado === 'mantenimiento')
            .length,
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
          const fullName =
            `${driver.nombre} ${driver.apellido_paterno} ${driver.apellido_materno}`.trim();
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
    }),
    { name: 'fleet-storage' }
  )
);

export default useFleetStore;
