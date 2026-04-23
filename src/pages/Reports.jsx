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
function SeccionUnidades({ trucks, facturas, gastos, maintenance, trips }) {
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

  const hasTrucks = trucks.length > 0;
  const hasFinancial = data.some((d) => d.ingresos > 0 || d.gastos > 0 || d.combustible > 0);
  // Si hay camiones reales, siempre los mostramos (aunque tengan $0).
  // Solo mostramos ficticios cuando la BD está completamente vacía de camiones.
  const display = hasTrucks ? data : DEMO_UNIT_DATA.map((d) => ({ ...d, truck: null }));

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
function SeccionViajes({ trips, trucks, drivers, maintenance }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroCamion, setFiltroCamion] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getTruck = (id) => trucks.find((t) => t.id === id);
  const getDriver = (id) => drivers.find((d) => d.id === id);

  const tripData = useMemo(() => {
    const completed = trips.filter((t) => t.estado === 'completado' || t.estado === 'en_curso');
    return completed.map((trip) => {
      const truck = getTruck(trip.camion_id);
      const driver = getDriver(trip.chofer_id);
      const ingreso = parseMoney(trip.costo_flete ?? trip.costo);
      const combustible = parseMoney(trip.combustible_costo);
      const mant = maintenance
        .filter((m) => m.camion_id === trip.camion_id)
        .reduce((s, m) => s + parseMoney(m.costo), 0) / Math.max(trips.filter((t) => t.camion_id === trip.camion_id).length, 1);
      const margen = ingreso - combustible - mant;
      const pctMargen = ingreso > 0 ? (margen / ingreso) * 100 : 0;
      return {
        id: trip.id,
        folio: trip.numero_viaje ?? trip.id?.slice(0, 6) ?? '—',
        origen: trip.origen,
        destino: trip.destino,
        cliente: trip.cliente,
        unidad: truck?.numero_unidad ?? '—',
        camion_id: trip.camion_id,
        chofer: driver ? `${driver.nombre} ${driver.apellido_paterno}` : '—',
        fecha: trip.fecha_salida,
        ingreso,
        combustible,
        mantenimiento: mant,
        margen,
        pctMargen,
      };
    });
  }, [trips, trucks, drivers, maintenance]);

  const hasData = tripData.length > 0;
  const displayRaw = hasData ? tripData : DEMO_TRIPS.map((d) => ({ ...d, pctMargen: d.margen > 0 ? (d.margen / d.ingreso) * 100 : 0 }));

  const display = displayRaw.filter((row) => {
    if (filtroCamion && row.camion_id !== filtroCamion) return false;
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
              <label className="block text-xs text-gray-500 mb-1 font-medium">Camión</label>
              <select value={filtroCamion} onChange={(e) => setFiltroCamion(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Todos</option>
                {trucks.map((t) => <option key={t.id} value={t.id}>{t.numero_unidad} — {t.marca} {t.modelo}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button onClick={() => { setFechaInicio(''); setFechaFin(''); setFiltroCamion(''); }}
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
              {['Folio', 'Ruta', 'Cliente', 'Unidad', 'Chofer', 'Fecha', 'Ingreso', 'Combustible', 'Mantenimiento', 'Margen neto', '% Margen'].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {display.length === 0 ? (
              <tr><td colSpan={11} className="py-10 text-center text-gray-400">Sin viajes con los filtros seleccionados</td></tr>
            ) : display.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-900">{row.folio}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{row.origen} → {row.destino}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.cliente}</td>
                <td className="px-3 py-2.5 font-medium text-gray-900">{row.unidad}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.chofer}</td>
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
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={6} className="px-3 py-3 text-xs font-bold text-gray-600 uppercase">{display.length} viaje{display.length !== 1 ? 's' : ''}</td>
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

// ── SECCIÓN 3: Gráficas Mensuales ────────────────────────────────
function SeccionGraficas({ facturas, gastos, maintenance, trips }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  const monthlyData = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      mes: MONTHS[i],
      facturacion: 0,
      combustible: 0,
      mantenimiento: 0,
      otros: 0,
    }));

    facturas.forEach((f) => {
      if (!f.fecha) return;
      const d = new Date(f.fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      byMonth[d.getMonth()].facturacion += parseMoney(f.monto);
    });

    trips.forEach((t) => {
      const fecha = t.fecha_salida || t.fecha;
      if (!fecha) return;
      const d = new Date(fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      byMonth[d.getMonth()].facturacion += parseMoney(t.costo_flete ?? t.costo);
      byMonth[d.getMonth()].combustible += parseMoney(t.combustible_costo);
    });

    maintenance.forEach((m) => {
      if (!m.fecha) return;
      const d = new Date(m.fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      byMonth[d.getMonth()].mantenimiento += parseMoney(m.costo);
    });

    gastos.forEach((g) => {
      if (!g.fecha) return;
      const d = new Date(g.fecha + 'T12:00:00');
      if (d.getFullYear() !== year) return;
      byMonth[d.getMonth()].otros += parseMoney(g.monto ?? g.cantidad);
    });

    return byMonth.map((m) => ({
      ...m,
      balance: m.facturacion - m.combustible - m.mantenimiento - m.otros,
    }));
  }, [facturas, gastos, maintenance, trips, year]);

  const hasData = monthlyData.some((m) => m.facturacion > 0 || m.mantenimiento > 0);
  const display = hasData ? monthlyData : buildDemoMonthly(year);

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
        {!hasData && <span className="text-xs text-amber-600 italic">(datos de ejemplo)</span>}
      </div>

      {/* Gráfica 1: Facturación mensual */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Facturación Mensual — {year}</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={display} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="facturacion" name="Facturación" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica 2: Gastos por categoría */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Gastos por Categoría — {year}</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={display} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="combustible" name="Combustible" stackId="a" fill="#ea580c" />
              <Bar dataKey="mantenimiento" name="Mantenimiento" stackId="a" fill="#dc2626" />
              <Bar dataKey="otros" name="Otros gastos" stackId="a" fill="#b91c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica 3: Balance mensual */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Balance Mensual (Ingresos − Gastos) — {year}</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={display} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#16a34a" strokeWidth={2.5} fill="url(#balanceGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── SECCIÓN 4: Exportar ───────────────────────────────────────────
function SeccionExportar({ trucks, facturas, gastos, maintenance, trips, chartsRef }) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);

  const getUnitData = () => {
    return trucks.map((truck) => {
      const ingresos =
        facturas.filter((f) => f.camion_id === truck.id).reduce((s, f) => s + parseMoney(f.monto), 0) +
        trips.filter((t) => t.camion_id === truck.id && (t.estado === 'completado' || t.estado === 'en_curso'))
          .reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
      const gastosAdmin = gastos.filter((g) => g.camion_id === truck.id).reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0);
      const gastosMantenimiento = maintenance.filter((m) => m.camion_id === truck.id).reduce((s, m) => s + parseMoney(m.costo), 0);
      const combustible = trips.filter((t) => t.camion_id === truck.id).reduce((s, t) => s + parseMoney(t.combustible_costo), 0);
      const totalGastos = gastosAdmin + gastosMantenimiento;
      return {
        Unidad: truck.numero_unidad,
        Camión: `${truck.marca} ${truck.modelo}`,
        'Ingresos (MXN)': ingresos,
        'Gastos Admin (MXN)': gastosAdmin,
        'Mantenimiento (MXN)': gastosMantenimiento,
        'Combustible (MXN)': combustible,
        'Total Gastos (MXN)': totalGastos,
        'Rentabilidad (MXN)': ingresos - totalGastos - combustible,
      };
    }).sort((a, b) => b['Rentabilidad (MXN)'] - a['Rentabilidad (MXN)']);
  };

  const exportExcel = async () => {
    setLoadingXls(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Hoja 1: Unidades
      const unitData = getUnitData();
      const ws1 = XLSX.utils.json_to_sheet(unitData.length > 0 ? unitData : [{ Nota: 'Sin datos registrados' }]);
      XLSX.utils.book_append_sheet(wb, ws1, 'Ingresos vs Gastos');

      // Hoja 2: Viajes
      const tripRows = trips
        .filter((t) => t.estado === 'completado' || t.estado === 'en_curso')
        .map((trip) => {
          const truck = trucks.find((t) => t.id === trip.camion_id);
          const driver = trucks.find(() => false); // placeholder
          return {
            Folio: trip.numero_viaje ?? trip.id?.slice(0, 8),
            Origen: trip.origen,
            Destino: trip.destino,
            Cliente: trip.cliente,
            Unidad: truck?.numero_unidad ?? '—',
            Fecha: trip.fecha_salida,
            'Ingreso (MXN)': parseMoney(trip.costo_flete ?? trip.costo),
            'Combustible (MXN)': parseMoney(trip.combustible_costo),
            Estado: trip.estado,
          };
        });
      const ws2 = XLSX.utils.json_to_sheet(tripRows.length > 0 ? tripRows : [{ Nota: 'Sin viajes completados' }]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de Viajes');

      // Hoja 3: Resumen mensual
      const year = new Date().getFullYear();
      const monthlyRows = MONTHS.map((mes, i) => {
        const mesFacturas = facturas
          .filter((f) => f.fecha && new Date(f.fecha + 'T12:00:00').getFullYear() === year && new Date(f.fecha + 'T12:00:00').getMonth() === i)
          .reduce((s, f) => s + parseMoney(f.monto), 0);
        const mesTrips = trips
          .filter((t) => { const f = t.fecha_salida || t.fecha; return f && new Date(f + 'T12:00:00').getFullYear() === year && new Date(f + 'T12:00:00').getMonth() === i; })
          .reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
        const mesGastos = gastos
          .filter((g) => g.fecha && new Date(g.fecha + 'T12:00:00').getFullYear() === year && new Date(g.fecha + 'T12:00:00').getMonth() === i)
          .reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0);
        const mesMant = maintenance
          .filter((m) => m.fecha && new Date(m.fecha + 'T12:00:00').getFullYear() === year && new Date(m.fecha + 'T12:00:00').getMonth() === i)
          .reduce((s, m) => s + parseMoney(m.costo), 0);
        const ingresos = mesFacturas + mesTrips;
        const egresos = mesGastos + mesMant;
        return { Mes: mes, Año: year, 'Ingresos (MXN)': ingresos, 'Gastos (MXN)': egresos, 'Balance (MXN)': ingresos - egresos };
      });
      const ws3 = XLSX.utils.json_to_sheet(monthlyRows);
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

      const totalFacturado = facturas.reduce((s, f) => s + parseMoney(f.monto), 0) +
        trips.filter((t) => t.estado === 'completado').reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
      const totalGastos = gastos.reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0) +
        maintenance.reduce((s, m) => s + parseMoney(m.costo), 0);
      const balance = totalFacturado - totalGastos;

      const cards = [
        { label: 'Total Facturado', val: formatCurrency(totalFacturado), color: [22, 163, 74] },
        { label: 'Total Gastos', val: formatCurrency(totalGastos), color: [220, 38, 38] },
        { label: 'Balance Neto', val: formatCurrency(balance), color: balance >= 0 ? [22, 163, 74] : [220, 38, 38] },
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
      const headers = ['Unidad', 'Camión', 'Ingresos', 'Gastos', 'Rentabilidad'];
      const colWidths = [20, 50, 36, 36, 36];
      const rowH = 7;

      // Header row
      doc.setFillColor(220, 38, 38);
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let xCol = margin + 2;
      headers.forEach((h, i) => { doc.text(h, xCol, y + 5); xCol += colWidths[i]; });
      y += rowH;

      // Data rows
      doc.setFont('helvetica', 'normal');
      unitData.slice(0, 15).forEach((row, idx) => {
        if (y > pageH - 20) { doc.addPage(); y = margin; }
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
        doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(7.5);
        xCol = margin + 2;
        [row['Unidad'], row['Camión'], formatCurrency(row['Ingresos (MXN)']), formatCurrency(row['Total Gastos (MXN)']), formatCurrency(row['Rentabilidad (MXN)'])].forEach((val, i) => {
          if (i >= 2) {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
            doc.setTextColor(i === 4 ? (num >= 0 ? 22 : 220) : 31, i === 4 ? (num >= 0 ? 163 : 38) : 41, i === 4 ? (num >= 0 ? 74 : 38) : 55);
          }
          doc.text(String(val), xCol, y + 5);
          xCol += colWidths[i];
          doc.setTextColor(31, 41, 55);
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

  const totalFacturado = facturas.reduce((s, f) => s + parseMoney(f.monto), 0) +
    trips.filter((t) => t.estado === 'completado').reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
  const totalGastos = gastos.reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0) +
    maintenance.reduce((s, m) => s + parseMoney(m.costo), 0);

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
  { id: 'units', label: 'Ingresos vs Gastos por Unidad', short: 'Por Unidad' },
  { id: 'trips', label: 'Rentabilidad por Viaje', short: 'Por Viaje' },
  { id: 'charts', label: 'Gráficas Mensuales', short: 'Gráficas' },
  { id: 'export', label: 'Exportar Reportes', short: 'Exportar' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('units');
  const { trucks, drivers, trips, maintenance, facturas, gastos } = useFleetStore();
  const chartsRef = useRef(null);

  const totalFacturado =
    facturas.reduce((s, f) => s + parseMoney(f.monto), 0) +
    trips.filter((t) => t.estado === 'completado').reduce((s, t) => s + parseMoney(t.costo_flete ?? t.costo), 0);
  const totalGastos =
    gastos.reduce((s, g) => s + parseMoney(g.monto ?? g.cantidad), 0) +
    maintenance.reduce((s, m) => s + parseMoney(m.costo), 0);
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
          {activeTab === 'units' && (
            <SeccionUnidades
              trucks={trucks} facturas={facturas} gastos={gastos}
              maintenance={maintenance} trips={trips}
            />
          )}
          {activeTab === 'trips' && (
            <SeccionViajes
              trips={trips} trucks={trucks} drivers={drivers} maintenance={maintenance}
            />
          )}
          {activeTab === 'charts' && (
            <div ref={chartsRef}>
              <SeccionGraficas
                facturas={facturas} gastos={gastos} maintenance={maintenance} trips={trips}
              />
            </div>
          )}
          {activeTab === 'export' && (
            <SeccionExportar
              trucks={trucks} facturas={facturas} gastos={gastos}
              maintenance={maintenance} trips={trips} chartsRef={chartsRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
