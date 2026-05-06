import { useState } from 'react';
import {
  Truck, Plus, Search, RefreshCw, Eye, Edit, Trash2, X, AlertTriangle, Wifi, WifiOff, CheckCircle,
} from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { statusClass, statusLabel, formatNumber, getOilStatus } from '../utils/helpers';
import { fetchWialonUnits, getWialonToken, saveWialonMapping, getWialonMapping } from '../lib/wialon';

const STATUS_FILTERS = ['Todos', 'disponible', 'en_viaje', 'mantenimiento'];

const emptyForm = {
  numero_unidad: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  placa: '',
  vin: '',
  capacidad_carga: '',
  kilometraje_actual: '',
  estado: 'disponible',
  ultimo_cambio_aceite: '',
  intervalo_cambio_aceite: 10000,
  fecha_ultimo_mantenimiento: '',
  notas: '',
};

function OilBar({ truck }) {
  const oil = getOilStatus(truck);
  const colors = {
    red: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-100' },
    yellow: { bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
    green: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  };
  const c = colors[oil.color];
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">Cambio de Aceite</span>
        <span className={`font-medium ${c.text}`}>
          {oil.status === 'vencido'
            ? `Vencido +${formatNumber(oil.remaining)} km`
            : `${formatNumber(oil.remaining)} km restantes`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${c.bar} rounded-full transition-all`}
          style={{ width: `${oil.pct}%` }}
        />
      </div>
    </div>
  );
}

function TruckCard({ truck, onEdit, onDelete, onView }) {
  const oil = getOilStatus(truck);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-lg p-2">
            <Truck className="w-5 h-5 text-red-700" />
          </div>
          <div>
            <div className="font-bold text-gray-900">Unidad {truck.numero_unidad}</div>
            <div className="text-xs text-gray-500">{truck.marca} {truck.modelo}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(truck.estado)}`}>
          {statusLabel[truck.estado]}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
        <div><span className="text-gray-400">Año:</span> {truck.anio}</div>
        <div><span className="text-gray-400">Placa:</span> {truck.placa || '—'}</div>
        <div><span className="text-gray-400">Km:</span> {formatNumber(truck.kilometraje_actual)}</div>
        <div><span className="text-gray-400">Cap:</span> {formatNumber(truck.capacidad_carga)} kg</div>
      </div>

      {truck.vin && (
        <div className="text-xs text-gray-400 mb-1 truncate">VIN: {truck.vin}</div>
      )}

      {/* Oil bar */}
      <OilBar truck={truck} />

      {/* Alert badge */}
      {oil.status === 'vencido' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Se requiere cambio de aceite inmediato
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
        <button
          onClick={() => onView(truck)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg py-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Ver
        </button>
        <button
          onClick={() => onEdit(truck)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={() => onDelete(truck)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, half }) {
  return (
    <div className={half ? '' : 'col-span-2 sm:col-span-1'}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function Fleet() {
  const { trucks, addTruck, updateTruck, deleteTruck } = useFleetStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Wialon sync state
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [wialonUnits, setWialonUnits] = useState([]);
  const [mapping, setMapping] = useState({}); // wialonId -> truckId
  const [syncDone, setSyncDone] = useState(false);

  const handleSync = async () => {
    const token = getWialonToken();
    if (!token) {
      setSyncError('No hay token de Wialon configurado. Ve a Ajustes para guardarlo.');
      setShowSyncModal(true);
      return;
    }
    setSyncing(true);
    setSyncError('');
    setSyncDone(false);
    try {
      const units = await fetchWialonUnits(token);
      console.log('Wialon units raw:', JSON.stringify(units[0]?.raw, null, 2));
      setWialonUnits(units);
      // Cargar mapeo guardado, y completar con auto-mapeo para unidades nuevas
      const saved = getWialonMapping();
      const autoMap = { ...saved };
      units.forEach((u) => {
        if (autoMap[u.id]) return; // ya tiene mapeo guardado
        const match = trucks.find((t) =>
          u.name.toLowerCase().includes(t.numero_unidad.toLowerCase()) ||
          t.numero_unidad.toLowerCase().includes(u.name.toLowerCase())
        );
        if (match) autoMap[u.id] = match.id;
      });
      setMapping(autoMap);
      setShowSyncModal(true);
    } catch (err) {
      setSyncError(err.message);
      setShowSyncModal(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleApplySync = async () => {
    // Guardar el mapeo para la próxima vez
    saveWialonMapping(mapping);
    for (const [wialonId, truckId] of Object.entries(mapping)) {
      if (!truckId) continue;
      const unit = wialonUnits.find((u) => String(u.id) === String(wialonId));
      if (!unit || unit.mileage_km == null) continue;
      await updateTruck(truckId, { kilometraje_actual: unit.mileage_km });
    }
    setSyncDone(true);
    setTimeout(() => {
      setShowSyncModal(false);
      setSyncDone(false);
    }, 1500);
  };

  const filtered = trucks.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.numero_unidad.toLowerCase().includes(q) ||
      t.marca.toLowerCase().includes(q) ||
      t.modelo.toLowerCase().includes(q) ||
      (t.placa && t.placa.toLowerCase().includes(q));
    const matchFilter = filter === 'Todos' || t.estado === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (truck) => {
    setEditItem(truck);
    setForm({ ...truck });
    setShowModal(true);
  };

  const handleDelete = (truck) => {
    if (window.confirm(`¿Eliminar Unidad ${truck.numero_unidad}?`)) {
      deleteTruck(truck.id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

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
    if (editItem) {
      updateTruck(editItem.id, data);
    } else {
      addTruck(data);
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-gray-500 text-sm">
            {trucks.length} unidades registradas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Conectando...' : 'Sincronizar GPS'}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Unidad
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, marca, modelo o placa..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'Todos' ? 'Todos' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron unidades</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              onEdit={openEdit}
              onDelete={handleDelete}
              onView={(t) => setShowDetail(t)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">Unidad {showDetail.numero_unidad}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Marca', showDetail.marca],
                ['Modelo', showDetail.modelo],
                ['Año', showDetail.anio],
                ['Placa', showDetail.placa || '—'],
                ['VIN', showDetail.vin || '—'],
                ['Capacidad', `${formatNumber(showDetail.capacidad_carga)} kg`],
                ['Kilometraje', `${formatNumber(showDetail.kilometraje_actual)} km`],
                ['Estado', statusLabel[showDetail.estado]],
                ['Último aceite', `${formatNumber(showDetail.ultimo_cambio_aceite)} km`],
                ['Intervalo', `${formatNumber(showDetail.intervalo_cambio_aceite)} km`],
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
          </div>
        </div>
      )}

      {/* Wialon Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Sincronizar GPS Wialon</h2>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {syncError ? (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <WifiOff className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Error de conexión</p>
                    <p className="text-xs text-red-600 mt-1">{syncError}</p>
                  </div>
                </div>
              ) : syncDone ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <p className="text-green-700 font-semibold">Kilometrajes actualizados</p>
                </div>
              ) : wialonUnits.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No se encontraron unidades en Wialon.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Se encontraron <strong>{wialonUnits.length}</strong> unidades en Wialon. Vincula cada una con un camión para actualizar sus kilómetros.
                  </p>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {wialonUnits.map((unit) => (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm text-gray-900">{unit.name}</span>
                            <span className="ml-2 text-xs text-blue-600 font-medium">
                              {unit.mileage_km != null ? `${formatNumber(unit.mileage_km)} km` : 'Sin datos de km'}
                            </span>
                          </div>
                        </div>
                        <select
                          value={mapping[unit.id] || ''}
                          onChange={(e) => setMapping((m) => ({ ...m, [unit.id]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">— No vincular —</option>
                          {trucks.map((t) => (
                            <option key={t.id} value={t.id}>
                              Unidad {t.numero_unidad} — {t.marca} {t.modelo}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleApplySync}
                      disabled={Object.values(mapping).every((v) => !v)}
                      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Aplicar Kilómetros
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editItem ? 'Editar Unidad' : 'Nueva Unidad'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditItem(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
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
                    <input
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={handleChange}
                      required={required}
                      className={inp}
                      min={type === 'number' ? 0 : undefined}
                    />
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
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={handleChange}
                    rows={2}
                    className={inp}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditItem(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium"
                >
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
