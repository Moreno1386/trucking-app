import { useState, useRef, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, FileSpreadsheet, BarChart2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Filter, Plus, Edit, Trash2, X, Eye } from 'lucide-react';
import { formatNumber, statusClass, statusLabel } from '../utils/helpers';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

// ── Helpers ───────────────────────────────────────────────────────
const parseMoney = (val) => parseFloat(String(val || 0).replace(/,/g, '')) || 0;

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const fmtPct = (n) => (isNaN(n) || !isFinite(n) ? '0%' : `${n.toFixed(1)}%`);

// Custom tooltip para recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Datos demo ────────────────────────────────────────────────────
const DEMO_UNIT_DATA = [
  { unidad: 'U-01', nombre: 'Volvo FH', ingresos: 95000, gastos: 28000, combustible: 17000, rentabilidad: 50000 },
  { unidad: 'U-02', nombre: 'Kenworth T680', ingresos: 78000, gastos: 31000, combustible: 14500, rentabilidad: 32500 },
  { unidad: 'U-03', nombre: 'Freightliner Cascadia', ingresos: 52000, gastos: 38000, combustible: 16000, rentabilidad: -2000 },
];

const DEMO_TRIPS = [
  { id: 'd1', folio: 'V-001', origen: 'Guadalajara', destino: 'CDMX', cliente: 'ACME S.A.', unidad: 'U-01', chofer: 'Carlos García', fecha: '2025-03-10', ingreso: 32000, combustible: 5800, mantenimiento: 0, margen: 26200 },
  { id: 'd2', folio: 'V-002', origen: 'Monterrey', destino: 'Tijuana', cliente: 'LogiMax', unidad: 'U-02', chofer: 'Juan López', fecha: '2025-03-15', ingreso: 48000, combustible: 9200, mantenimiento: 3500, margen: 35300 },
  { id: 'd3', folio: 'V-003', origen: 'CDMX', destino: 'Mérida', cliente: 'FreshFood', unidad: 'U-03', chofer: 'Pedro Ramos', fecha: '2025-03-22', ingreso: 39000, combustible: 7400, mantenimiento: 1200, margen: 30400 },
];

const buildDemoMonthly = (year) =>
  MONTHS.map((mes, i) => ({
    mes,
    facturacion: Math.round(60000 + Math.random() * 40000 + Math.sin(i) * 10000),
    combustible: Math.round(15000 + Math.random() * 8000),
    mantenimiento: Math.round(8000 + Math.random() * 12000),
    otros: Math.round(3000 + Math.random() * 5000),
    balance: 0,
  })).map((d) => ({ ...d, balance: d.facturacion - d.combustible - d.mantenimiento - d.otros }));

// ── Formulario vacío de camión ────────────────────────────────────
const emptyTruckForm = {
  numero_unidad: '', marca: '', modelo: '',
  anio: new Date().getFullYear(), placa: '', vin: '',
  capacidad_carga: '', kilometraje_actual: '',
  estado: 'disponible', ultimo_cambio_aceite: '',
  intervalo_cambio_aceite: 10000, fecha_ultimo_mantenimiento: '', notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

// ── SECCIÓN 1: Ingresos vs Gastos por Unidad ─────────────────────
function SeccionUnidades({ trucks, facturas, gastos, maintenance, trips, viajesAdmin }) {
  const { addTruck, updateTruck, deleteTruck } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyTruckForm);

  const openAdd = () => { setEditItem(null); setForm(emptyTruckForm); setShowModal(true); };
  const openEdit = (truck) => { setEditItem(truck); setForm({ ...truck }); setShowModal(true); };
  const handleDelete = (truck) => {
    if (window.confirm(`¿Eliminar Unidad ${truck.numero_unidad}? Esta acción no se puede deshacer.`)) deleteTruck(truck.id);
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      anio: parseInt(form.anio) || new Date().getFullYear(),
      capacidad_carga: parseFloat(form.capacidad_carga) || 0,
      kilometraje_actual: parseFloat(form.kilometraje_actual) || 0,
      ultimo_cambio_aceite: parseFloat(form.ultimo_cambio_aceite) || 0,
      intervalo_cambio_aceite: parseFloat(form.intervalo_cambio_aceite) || 10000,
      fecha_ultimo_mantenimiento: form.fecha_ultimo_mantenimiento || null,
    };
    if (editItem) updateTruck(editItem.id, data);
    else addTruck(data);
    setShowModal(false); setEditItem(null);
  };

  const data = useMemo(() => {
    return trucks.map((truck) => {
      const ingresos =
        facturas.filter((f) => f.camion_id === truck.id).reduce((s, f) => s + parseMoney(f.monto), 0) +
        trips.filter((t) => t.camion_id === truck.id && (t.estado === 'completado' || t.estado === 'en_curso'))
          .reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
      const gastosAdmin = gastos.filter((g) => g.camion_id === truck.id).reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0);
      const gastosMantenimiento = maintenance.filter((m) => m.camion_id === truck.id).reduce((s, m) => s + parseMoney(m.costo), 0);
      const combustible = trips.filter((t) => t.camion_id === truck.id).reduce((s, t) => s + parseMoney(t.combustible_costo), 0);
      const totalGastos = gastosAdmin + gastosMantenimiento;
      return { truck, unidad: truck.numero_unidad, nombre: `${truck.marca} ${truck.modelo}`, ingresos, gastos: totalGastos, combustible, rentabilidad: ingresos - totalGastos - combustible };
    }).sort((a, b) => b.rentabilidad - a.rentabilidad);
  }, [trucks, facturas, gastos, maintenance, trips]);

  // Agrupar viajesAdmin por unidad
  const viajesPorUnidad = useMemo(() => {
    const map = {};
    viajesAdmin.forEach((v) => {
      const u = (v.unidad || '—').trim().toUpperCase();
      if (!map[u]) map[u] = { unidad: u, nombre: u, ingresos: 0, gastos: 0, combustible: 0, rentabilidad: 0, truck: null };
      map[u].ingresos += parseMoney(v.costo_servicio);
      map[u].combustible += parseMoney(v.diesel);
      map[u].gastos += parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador);
    });
    return Object.values(map).map((r) => ({ ...r, rentabilidad: r.ingresos - r.gastos - r.combustible }))
      .sort((a, b) => b.rentabilidad - a.rentabilidad);
  }, [viajesAdmin]);

  const hasTrucks = trucks.length > 0;
  const hasViajesAdmin = viajesPorUnidad.length > 0;
  const hasFinancial = data.some((d) => d.ingresos > 0 || d.gastos > 0 || d.combustible > 0);
  const display = hasViajesAdmin ? viajesPorUnidad : (hasTrucks ? data : DEMO_UNIT_DATA.map((d) => ({ ...d, truck: null })));

  return (
    <div className="space-y-6" id="section-units">
      {/* Header con botón Agregar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">{trucks.length} unidad{trucks.length !== 1 ? 'es' : ''} registrada{trucks.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva Unidad
        </button>
      </div>

      {!hasTrucks && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 flex items-start gap-2">
          <span className="text-lg leading-none">📊</span>
          <span>Mostrando datos de ejemplo. Agrega tu primera unidad con el botón "Nueva Unidad" para empezar.</span>
        </div>
      )}
      {hasTrucks && !hasFinancial && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-2">
          <span className="text-lg leading-none">💡</span>
          <span>Tus unidades están registradas. Registra viajes y facturas vinculadas a cada camión para ver sus ingresos y rentabilidad.</span>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingresos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Gastos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Combustible</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Rentabilidad neta</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {display.map((row) => (
              <tr key={row.unidad} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{row.unidad}</div>
                  <div className="text-xs text-gray-400">{row.nombre}</div>
                  {row.truck && (
                    <span className={`mt-0.5 inline-block text-xs px-1.5 py-0.5 rounded-full ${statusClass(row.truck.estado)}`}>
                      {statusLabel[row.truck.estado]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(row.ingresos)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(row.gastos)}</td>
                <td className="px-4 py-3 text-right text-orange-500">{formatCurrency(row.combustible)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 font-bold text-sm ${row.rentabilidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {row.rentabilidad >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {formatCurrency(row.rentabilidad)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.truck ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setShowDetail(row.truck)} title="Ver detalle"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(row.truck)} title="Editar"
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(row.truck)} title="Eliminar"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 text-center block">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Totales</td>
              <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(display.reduce((s, r) => s + r.ingresos, 0))}</td>
              <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(display.reduce((s, r) => s + r.gastos, 0))}</td>
              <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(display.reduce((s, r) => s + r.combustible, 0))}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(display.reduce((s, r) => s + r.rentabilidad, 0))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Gráfica */}
      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Comparativa por Unidad</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={display} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="unidad" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="combustible" name="Combustible" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal Ver detalle */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900 text-lg">Unidad {showDetail.numero_unidad}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Marca', showDetail.marca],
                ['Modelo', showDetail.modelo],
                ['Año', showDetail.anio],
                ['Placa', showDetail.placa || '—'],
                ['VIN', showDetail.vin || '—'],
                ['Capacidad', `${formatNumber(showDetail.capacidad_carga)} kg`],
                ['Kilometraje', `${formatNumber(showDetail.kilometraje_actual)} km`],
                ['Estado', statusLabel[showDetail.estado] ?? showDetail.estado],
                ['Último aceite (km)', formatNumber(showDetail.ultimo_cambio_aceite)],
                ['Intervalo aceite (km)', formatNumber(showDetail.intervalo_cambio_aceite)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-medium text-gray-900">{v}</div>
                </div>
              ))}
              {showDetail.notas && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400">Notas</div>
                  <div className="text-gray-700">{showDetail.notas}</div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => setShowDetail(null)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h3 className="font-bold text-gray-900 text-lg">{editItem ? 'Editar Unidad' : 'Nueva Unidad'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['numero_unidad', 'Número de Unidad *', 'text', true],
                  ['marca', 'Marca *', 'text', true],
                  ['modelo', 'Modelo *', 'text', true],
                  ['anio', 'Año *', 'number', true],
                  ['placa', 'Placa', 'text', false],
                  ['vin', 'VIN', 'text', false],
                  ['capacidad_carga', 'Capacidad de Carga (kg)', 'number', false],
                  ['kilometraje_actual', 'Kilometraje Actual *', 'number', true],
                  ['ultimo_cambio_aceite', 'Último Cambio de Aceite (km)', 'number', false],
                  ['intervalo_cambio_aceite', 'Intervalo Cambio Aceite (km)', 'number', false],
                  ['fecha_ultimo_mantenimiento', 'Último Mantenimiento', 'date', false],
                ].map(([name, label, type, required]) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input name={name} type={type} value={form[name] ?? ''} onChange={handleChange}
                      required={required} className={inp} min={type === 'number' ? 0 : undefined} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="disponible">Disponible</option>
                    <option value="en_viaje">En Viaje</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas ?? ''} onChange={handleChange} rows={2} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                  {editItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN 2: Rentabilidad por Viaje ────────────────────────────
function SeccionViajes({ trips, trucks, drivers, maintenance, viajesAdmin }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getTruck = (id) => trucks.find((t) => t.id === id);
  const getDriver = (id) => drivers.find((d) => d.id === id);

  const tripData = useMemo(() => {
    // Viajes de despacho
    const dispatchRows = trips.filter((t) => t.estado === 'completado' || t.estado === 'en_curso').map((trip) => {
      const truck = getTruck(trip.camion_id);
      const driver = getDriver(trip.chofer_id);
      const ingreso = parseMoney(trip.costo_flete ?? trip.costo);
      const combustible = parseMoney(trip.combustible_costo);
      const mant = maintenance
        .filter((m) => m.camion_id === trip.camion_id)
        .reduce((s, m) => s + parseMoney(m.costo), 0) / Math.max(trips.filter((t) => t.camion_id === trip.camion_id).length, 1);
      const margen = ingreso - combustible - mant;
      return {
        id: trip.id, folio: trip.numero_viaje ?? trip.id?.slice(0, 6) ?? '—',
        destino: trip.destino, unidad: truck?.numero_unidad ?? '—', camion_id: trip.camion_id,
        chofer: driver ? `${driver.nombre} ${driver.apellido_paterno}` : '—',
        fecha: trip.fecha_salida, ingreso, combustible, mantenimiento: mant,
        margen, pctMargen: ingreso > 0 ? (margen / ingreso) * 100 : 0,
      };
    });

    // Viajes del Registro Administrativo
    const adminRows = viajesAdmin.map((v) => {
      const ingreso = parseMoney(v.costo_servicio);
      const combustible = parseMoney(v.diesel);
      const otros = parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador);
      const margen = ingreso - combustible - otros;
      return {
        id: v.id, folio: '—',
        destino: v.destino, unidad: v.unidad, camion_id: null,
        chofer: v.operador, fecha: v.fecha,
        ingreso, combustible, mantenimiento: otros,
        margen, pctMargen: ingreso > 0 ? (margen / ingreso) * 100 : 0,
      };
    });

    return [...adminRows, ...dispatchRows].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  }, [trips, trucks, drivers, maintenance, viajesAdmin]);

  const unidades = useMemo(() => [...new Set(tripData.map((r) => r.unidad).filter(Boolean))].sort(), [tripData]);

  const hasData = tripData.length > 0;
  const displayRaw = hasData ? tripData : DEMO_TRIPS.map((d) => ({ ...d, pctMargen: d.margen > 0 ? (d.margen / d.ingreso) * 100 : 0 }));

  const display = displayRaw.filter((row) => {
    if (filtroUnidad && row.unidad !== filtroUnidad) return false;
    if (fechaInicio && row.fecha < fechaInicio) return false;
    if (fechaFin && row.fecha > fechaFin) return false;
    return true;
  });

  const totals = display.reduce(
    (acc, r) => ({ ingreso: acc.ingreso + r.ingreso, combustible: acc.combustible + r.combustible, mantenimiento: acc.mantenimiento + r.mantenimiento, margen: acc.margen + r.margen }),
    { ingreso: 0, combustible: 0, mantenimiento: 0, margen: 0 }
  );

  return (
    <div className="space-y-5" id="section-trips">
      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 flex items-start gap-2">
          <span className="text-lg leading-none">🚛</span>
          <span>Mostrando datos de ejemplo. Completa viajes para ver la rentabilidad real por trayecto.</span>
        </div>
      )}

      {/* Filtros */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Fecha inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Fecha fin</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Unidad</label>
              <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Todas</option>
                {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button onClick={() => { setFechaInicio(''); setFechaFin(''); setFiltroUnidad(''); }}
                className="text-xs text-gray-500 hover:text-red-600 underline">Limpiar filtros</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['Destino', 'Operador', 'Unidad', 'Fecha', 'Costo Serv.', 'Diesel', 'Casetas/Otros', 'Utilidad', '% Utilidad'].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {display.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-400">Sin viajes con los filtros seleccionados</td></tr>
            ) : display.map((row) => (
              <tr key={row.id} className="hover:bg-orange-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{row.destino}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{row.chofer}</td>
                <td className="px-3 py-2.5"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{row.unidad}</span></td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{formatDate(row.fecha)}</td>
                <td className="px-3 py-2.5 text-right font-medium text-green-600">{formatCurrency(row.ingreso)}</td>
                <td className="px-3 py-2.5 text-right text-orange-500">{formatCurrency(row.combustible)}</td>
                <td className="px-3 py-2.5 text-right text-red-500">{formatCurrency(row.mantenimiento)}</td>
                <td className={`px-3 py-2.5 text-right font-bold ${row.margen >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(row.margen)}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${row.pctMargen >= 20 ? 'bg-green-100 text-green-700' : row.pctMargen >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {fmtPct(row.pctMargen)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {display.length > 0 && (
            <tfoot className="bg-orange-50 border-t-2 border-orange-200">
              <tr>
                <td colSpan={4} className="px-3 py-3 text-xs font-bold text-gray-600 uppercase">{display.length} viaje{display.length !== 1 ? 's' : ''}</td>
                <td className="px-3 py-3 text-right font-bold text-green-700">{formatCurrency(totals.ingreso)}</td>
                <td className="px-3 py-3 text-right font-bold text-orange-600">{formatCurrency(totals.combustible)}</td>
                <td className="px-3 py-3 text-right font-bold text-red-600">{formatCurrency(totals.mantenimiento)}</td>
                <td className={`px-3 py-3 text-right font-bold ${totals.margen >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(totals.margen)}</td>
                <td className="px-3 py-3 text-right font-bold text-gray-700">
                  {fmtPct(totals.ingreso > 0 ? (totals.margen / totals.ingreso) * 100 : 0)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// Colores para las líneas por vehículo
const VEHICLE_COLORS = ['#16a34a','#dc2626','#2563eb','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#6366f1'];

// ── SECCIÓN 3: Gráficas Mensuales ────────────────────────────────
function SeccionGraficas({ maintenance, viajesAdmin, trucks, insurances }) {
  const { isLoading } = useFleetStore();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  // Prima mensual por camión (placa → prima/12)
  const primaMensualPorPlaca = useMemo(() => {
    const map = {};
    insurances.filter((i) => i.estado === 'activo').forEach((ins) => {
      const truck = trucks.find((t) => t.id === ins.camion_id);
      if (!truck || !truck.placa) return;
      const placa = truck.placa.trim().toUpperCase();
      map[placa] = (map[placa] || 0) + (parseFloat(ins.prima_anual) || 0) / 12;
    });
    return map;
  }, [insurances, trucks]);

  // Gasto de mantenimiento por placa y mes
  const mantPorPlacaMes = useMemo(() => {
    const map = {};
    maintenance.forEach((m) => {
      if (!m.fecha) return;
      const d = new Date(m.fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      const truck = trucks.find((t) => t.id === m.camion_id);
      if (!truck || !truck.placa) return;
      const placa = truck.placa.trim().toUpperCase();
      const mes = d.getMonth();
      const key = `${placa}__${mes}`;
      map[key] = (map[key] || 0) + (parseFloat(m.costo) || 0);
    });
    return map;
  }, [maintenance, trucks, year]);

  // Utilidad neta por placa y mes (misma lógica que UtilidadVehiculo)
  const { placas, porPlacaMes } = useMemo(() => {
    const data = {}; // data[placa][mes] = utilidadNeta
    viajesAdmin.forEach((v) => {
      if (!v.fecha) return;
      const d = new Date(v.fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      const placa = (v.unidad || '').trim().toUpperCase();
      if (!placa) return;
      const mes = d.getMonth();
      if (!data[placa]) data[placa] = Array(12).fill(0);
      const utilViaje =
        parseMoney(v.costo_servicio) -
        parseMoney(v.diesel) -
        parseMoney(v.casetas_efectivo) -
        parseMoney(v.casetas_televia) -
        parseMoney(v.otros_gastos) -
        parseMoney(v.pago_operador);
      data[placa][mes] += utilViaje;
    });

    // Descontar prima mensual y mantenimiento
    Object.keys(data).forEach((placa) => {
      const prima = primaMensualPorPlaca[placa] || 0;
      for (let m = 0; m < 12; m++) {
        const mant = mantPorPlacaMes[`${placa}__${m}`] || 0;
        data[placa][m] -= prima + mant;
      }
    });

    return { placas: Object.keys(data).sort(), porPlacaMes: data };
  }, [viajesAdmin, year, primaMensualPorPlaca, mantPorPlacaMes]);

  // Datos para gráfica 1: todos los vehículos por mes
  const allVehiclesData = useMemo(() =>
    MONTHS.map((mes, i) => {
      const row = { mes };
      placas.forEach((p) => { row[p] = Math.round(porPlacaMes[p][i]); });
      return row;
    }), [placas, porPlacaMes]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full" />
        Cargando datos...
      </div>
    );
  }

  if (placas.length === 0) {
    return (
      <div className="space-y-4" id="section-charts">
        <p className="text-sm text-gray-400 italic">No hay viajes registrados para {year}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="section-charts">
      {/* Selector de año */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Año:</span>
        <div className="flex gap-1.5">
          {years.map((y) => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${year === y ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfica 1: Barras horizontales — meses en Y, vehículos agrupados */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Todos los Vehículos — Utilidad Neta por Mes {year}</h4>
        <div style={{ height: MONTHS.length * 48 + 60 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={MONTHS.map((mes, mi) => {
                const row = { mes };
                placas.forEach((p) => { row[p] = Math.round(porPlacaMes[p][mi]); });
                return row;
              })}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="mes" tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {placas.map((placa, i) => (
                <Bar key={placa} dataKey={placa} name={placa} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} radius={[0, 2, 2, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica 2: Por vehículo y por mes */}
      <div className="space-y-5">
        <h4 className="text-sm font-semibold text-gray-700">Por Vehículo y por Mes — {year}</h4>
        {placas.map((placa, i) => {
          const color = VEHICLE_COLORS[i % VEHICLE_COLORS.length];
          const totalAnual = porPlacaMes[placa].reduce((s, v) => s + v, 0);
          const barData = MONTHS.map((mes, mi) => ({ mes, utilidad: Math.round(porPlacaMes[placa][mi]) }));
          return (
            <div key={placa} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-gray-800 font-mono">{placa}</h5>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total anual</div>
                  <div className={`font-bold text-sm ${totalAnual >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(totalAnual)}
                  </div>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="utilidad" name="Utilidad Neta" fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SECCIÓN 4: Exportar ───────────────────────────────────────────
function SeccionExportar({ trucks, facturas, gastos, maintenance, trips, viajesAdmin, chartsRef }) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);

  // Agrupa viajesAdmin por unidad — fuente de datos real
  const getUnitData = () => {
    const map = {};
    viajesAdmin.forEach((v) => {
      const u = v.unidad || '—';
      if (!map[u]) map[u] = { unidad: u, ingresos: 0, diesel: 0, otrosGastos: 0 };
      map[u].ingresos    += parseMoney(v.costo_servicio);
      map[u].diesel      += parseMoney(v.diesel);
      map[u].otrosGastos += parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador);
    });
    return Object.values(map).map((r) => ({
      Unidad: r.unidad,
      'Ingresos (MXN)': r.ingresos,
      'Diesel (MXN)': r.diesel,
      'Otros Gastos (MXN)': r.otrosGastos,
      'Total Gastos (MXN)': r.diesel + r.otrosGastos,
      'Utilidad (MXN)': r.ingresos - r.diesel - r.otrosGastos,
    })).sort((a, b) => b['Utilidad (MXN)'] - a['Utilidad (MXN)']);
  };

  // Totales reales desde viajesAdmin
  const totalFacturado = viajesAdmin.reduce((s, v) => s + parseMoney(v.costo_servicio), 0);
  const totalGastos    = viajesAdmin.reduce((s, v) =>
    s + parseMoney(v.diesel) + parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador), 0);

  const exportExcel = async () => {
    setLoadingXls(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Hoja 1: Rentabilidad por Unidad
      const unitData = getUnitData();
      const ws1 = XLSX.utils.json_to_sheet(unitData.length > 0 ? unitData : [{ Nota: 'Sin datos registrados' }]);
      ws1['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Rentabilidad por Unidad');

      // Hoja 2: Detalle de Viajes (viajesAdmin)
      const tripRows = viajesAdmin.map((v) => ({
        Fecha: formatDate(v.fecha),
        Destino: v.destino,
        Operador: v.operador,
        Unidad: v.unidad,
        'Costo Servicio (MXN)': parseMoney(v.costo_servicio),
        'Diesel (MXN)': parseMoney(v.diesel),
        'Casetas Efectivo (MXN)': parseMoney(v.casetas_efectivo),
        'Casetas Televia (MXN)': parseMoney(v.casetas_televia),
        'Otros Gastos (MXN)': parseMoney(v.otros_gastos),
        'Pago Operador (MXN)': parseMoney(v.pago_operador),
        'Utilidad (MXN)': parseMoney(v.costo_servicio) - parseMoney(v.diesel) - parseMoney(v.casetas_efectivo) - parseMoney(v.casetas_televia) - parseMoney(v.otros_gastos) - parseMoney(v.pago_operador),
      }));
      const ws2 = XLSX.utils.json_to_sheet(tripRows.length > 0 ? tripRows : [{ Nota: 'Sin viajes registrados' }]);
      ws2['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de Viajes');

      // Hoja 3: Resumen mensual desde viajesAdmin
      const year = new Date().getFullYear();
      const monthlyRows = MONTHS.map((mes, i) => {
        const delMes = viajesAdmin.filter((v) => {
          if (!v.fecha) return false;
          const d = new Date(v.fecha + 'T12:00:00');
          return d.getFullYear() === year && d.getMonth() === i;
        });
        const ingresos = delMes.reduce((s, v) => s + parseMoney(v.costo_servicio), 0);
        const egresos  = delMes.reduce((s, v) => s + parseMoney(v.diesel) + parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador), 0);
        return { Mes: mes, Año: year, Viajes: delMes.length, 'Ingresos (MXN)': ingresos, 'Gastos (MXN)': egresos, 'Utilidad (MXN)': ingresos - egresos };
      });
      const ws3 = XLSX.utils.json_to_sheet(monthlyRows);
      ws3['!cols'] = [{ wch: 8 }, { wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Resumen Mensual');

      XLSX.writeFile(wb, `Reporte_ChairesT_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert('Error al generar Excel: ' + e.message);
    } finally {
      setLoadingXls(false);
    }
  };

  const exportPDF = async () => {
    setLoadingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // ── Encabezado ──
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAIRES TRUCKING', margin, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión de Flota', margin, 19);
      doc.setFontSize(9);
      doc.text(`Reporte generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 19, { align: 'right' });
      y = 36;

      // ── Resumen ejecutivo ──
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen Ejecutivo', margin, y);
      y += 7;

      const balance = totalFacturado - totalGastos;
      const cards = [
        { label: 'Total Ingresos', val: formatCurrency(totalFacturado), color: [22, 163, 74] },
        { label: 'Total Gastos', val: formatCurrency(totalGastos), color: [220, 38, 38] },
        { label: 'Utilidad Neta', val: formatCurrency(balance), color: balance >= 0 ? [22, 163, 74] : [220, 38, 38] },
      ];

      const colW = (pageW - margin * 2 - 8) / 3;
      cards.forEach((card, i) => {
        const x = margin + i * (colW + 4);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(x, y, colW, 18, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(card.label, x + colW / 2, y + 6, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...card.color);
        doc.text(card.val, x + colW / 2, y + 13, { align: 'center' });
      });
      y += 26;

      // ── Tabla por unidad ──
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rentabilidad por Unidad', margin, y);
      y += 6;

      const unitData = getUnitData();
      const headers = ['Unidad', 'Ingresos', 'Diesel', 'Otros Gastos', 'Utilidad'];
      const colWidths = [25, 38, 32, 38, 35];
      const rowH = 7;

      doc.setFillColor(220, 38, 38);
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let xCol = margin + 2;
      headers.forEach((h, i) => { doc.text(h, xCol, y + 5); xCol += colWidths[i]; });
      y += rowH;

      doc.setFont('helvetica', 'normal');
      unitData.slice(0, 20).forEach((row, idx) => {
        if (y > pageH - 20) { doc.addPage(); y = margin; }
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
        doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(7.5);
        xCol = margin + 2;
        const utilidad = row['Utilidad (MXN)'];
        [
          row['Unidad'],
          formatCurrency(row['Ingresos (MXN)']),
          formatCurrency(row['Diesel (MXN)']),
          formatCurrency(row['Otros Gastos (MXN)']),
          formatCurrency(utilidad),
        ].forEach((val, i) => {
          if (i === 4) doc.setTextColor(utilidad >= 0 ? 22 : 220, utilidad >= 0 ? 163 : 38, utilidad >= 0 ? 74 : 38);
          else doc.setTextColor(31, 41, 55);
          doc.text(String(val), xCol, y + 5);
          xCol += colWidths[i];
        });
        y += rowH;
      });
      y += 8;

      // ── Capturas de gráficas ──
      if (chartsRef?.current) {
        if (y > pageH - 80) { doc.addPage(); y = margin; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Gráficas Mensuales', margin, y);
        y += 5;
        const canvas = await html2canvas(chartsRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgW = pageW - margin * 2;
        const imgH = (canvas.height * imgW) / canvas.width;
        if (y + imgH > pageH - margin) { doc.addPage(); y = margin; }
        doc.addImage(imgData, 'JPEG', margin, y, imgW, Math.min(imgH, pageH - margin - y));
      }

      // ── Pie ──
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'normal');
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.text(`Chaires Trucking — Reporte confidencial | Pág. ${p} de ${totalPages}`, pageW / 2, pageH - 6, { align: 'center' });
      }

      doc.save(`Reporte_ChairesT_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      alert('Error al generar PDF: ' + e.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen previo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <div className="text-xs text-green-600 mb-1 font-medium">Total Facturado</div>
          <div className="text-xl font-bold text-green-700">{formatCurrency(totalFacturado)}</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <div className="text-xs text-red-600 mb-1 font-medium">Total Gastos</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(totalGastos)}</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${totalFacturado - totalGastos >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`text-xs mb-1 font-medium ${totalFacturado - totalGastos >= 0 ? 'text-green-600' : 'text-red-600'}`}>Balance Neto</div>
          <div className={`text-xl font-bold ${totalFacturado - totalGastos >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(totalFacturado - totalGastos)}</div>
        </div>
      </div>

      {/* Botones de exportación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Exportar PDF</div>
              <div className="text-xs text-gray-400">Reporte ejecutivo con gráficas</div>
            </div>
          </div>
          <ul className="text-xs text-gray-500 space-y-1 pl-1">
            <li>✓ Encabezado con logo y fecha</li>
            <li>✓ Resumen ejecutivo</li>
            <li>✓ Tabla de rentabilidad por unidad</li>
            <li>✓ Gráficas mensuales capturadas</li>
          </ul>
          <button
            onClick={exportPDF}
            disabled={loadingPdf}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loadingPdf ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generando PDF...</>
            ) : (
              <><Download className="w-4 h-4" /> Exportar PDF</>
            )}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Exportar Excel</div>
              <div className="text-xs text-gray-400">Datos tabulados en 3 hojas</div>
            </div>
          </div>
          <ul className="text-xs text-gray-500 space-y-1 pl-1">
            <li>✓ Hoja 1: Ingresos vs Gastos por Unidad</li>
            <li>✓ Hoja 2: Detalle de Viajes y Rentabilidad</li>
            <li>✓ Hoja 3: Resumen Mensual</li>
          </ul>
          <button
            onClick={exportExcel}
            disabled={loadingXls}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loadingXls ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generando Excel...</>
            ) : (
              <><FileSpreadsheet className="w-4 h-4" /> Exportar Excel</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
const TABS = [
  { id: 'charts', label: 'Gráficas Mensuales', short: 'Gráficas' },
  { id: 'export', label: 'Exportar Reportes', short: 'Exportar' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('charts');
  const { trucks, drivers, trips, maintenance, facturas, gastos, viajesAdmin, insurances } = useFleetStore();
  const chartsRef = useRef(null);

  const totalFacturado =
    facturas.reduce((s, f) => s + parseMoney(f.monto), 0) +
    trips.filter((t) => t.estado === 'completado').reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0) +
    viajesAdmin.reduce((s, v) => s + parseMoney(v.costo_servicio), 0);
  const totalGastos =
    gastos.reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0) +
    maintenance.reduce((s, m) => s + parseMoney(m.costo), 0) +
    viajesAdmin.reduce((s, v) => s + parseMoney(v.diesel) + parseMoney(v.casetas_efectivo) + parseMoney(v.casetas_televia) + parseMoney(v.otros_gastos) + parseMoney(v.pago_operador), 0);
  const balance = totalFacturado - totalGastos;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-red-600" />
          Reportes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Análisis financiero y rentabilidad de la flota</p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Facturado</div>
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalFacturado)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Gastos</div>
            <div className="text-lg font-bold text-red-700">{formatCurrency(totalGastos)}</div>
          </div>
        </div>
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <BarChart2 className={`w-5 h-5 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Balance Neto</div>
            <div className={`text-lg font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(balance)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab nav */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'charts' && (
            <div ref={chartsRef}>
              <SeccionGraficas
                facturas={facturas} gastos={gastos} maintenance={maintenance} trips={trips}
                viajesAdmin={viajesAdmin} trucks={trucks} insurances={insurances}
              />
            </div>
          )}
          {activeTab === 'export' && (
            <SeccionExportar
              trucks={trucks} facturas={facturas} gastos={gastos}
              maintenance={maintenance} trips={trips} viajesAdmin={viajesAdmin} chartsRef={chartsRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
