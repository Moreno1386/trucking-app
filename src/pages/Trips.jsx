import { useState } from 'react';
import { Route, Plus, Search, Edit, Trash2, X, MapPin, Calendar } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { statusClass, statusLabel, formatDate, formatCurrency } from '../utils/helpers';

const emptyForm = {
  numero_viaje: '',
  camion_id: '',
  chofer_id: '',
  origen: '',
  destino: '',
  cliente: '',
  fecha_salida: '',
  fecha_llegada_estimada: '',
  fecha_llegada_real: '',
  distancia_km: '',
  costo: '',
  estado: 'pendiente',
  notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const STATUS_FILTERS = ['Todos', 'pendiente', 'en_curso', 'completado', 'cancelado'];

export default function Trips() {
  const { trips, trucks, drivers, addTrip, updateTrip, deleteTrip } = useFleetStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const getTruck = (id) => trucks.find((t) => t.id === id);
  const getDriver = (id) => drivers.find((d) => d.id === id);

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (t.origen && t.origen.toLowerCase().includes(q)) ||
      (t.destino && t.destino.toLowerCase().includes(q)) ||
      (t.cliente && t.cliente.toLowerCase().includes(q)) ||
      (t.numero_viaje && t.numero_viaje.toLowerCase().includes(q));
    const matchFilter = filter === 'Todos' || t.estado === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, numero_viaje: `V-${String(trips.length + 1).padStart(3, '0')}` });
    setShowModal(true);
  };
  const openEdit = (t) => {
    setEditItem(t);
    setForm({ ...t });
    setShowModal(true);
  };
  const handleDelete = (t) => {
    if (window.confirm(`¿Eliminar viaje ${t.numero_viaje}?`)) deleteTrip(t.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      distancia_km: parseFloat(form.distancia_km) || 0,
      costo: parseFloat(form.costo) || 0,
    };
    if (editItem) {
      updateTrip(editItem.id, data);
    } else {
      addTrip(data);
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viajes</h1>
          <p className="text-gray-500 text-sm">{trips.length} viajes registrados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Viaje
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por origen, destino o cliente..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'Todos' ? 'Todos' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{trips.length === 0 ? 'No hay viajes registrados' : 'No se encontraron resultados'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => {
            const truck = getTruck(trip.camion_id);
            const driver = getDriver(trip.chofer_id);
            return (
              <div key={trip.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-2.5">
                      <Route className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{trip.numero_viaje}</div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{trip.origen || '—'}</span>
                        <span className="text-gray-300">→</span>
                        <span>{trip.destino || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(trip.estado)}`}>
                    {statusLabel[trip.estado]}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                  <div>
                    <div className="text-gray-400">Cliente</div>
                    <div className="font-medium">{trip.cliente || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Unidad</div>
                    <div className="font-medium">
                      {truck ? `Unidad ${truck.numero_unidad}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Chofer</div>
                    <div className="font-medium">
                      {driver ? `${driver.nombre} ${driver.apellido_paterno}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Costo</div>
                    <div className="font-medium">{formatCurrency(trip.costo)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Salida</div>
                    <div className="font-medium">{trip.fecha_salida ? formatDate(trip.fecha_salida.split('T')[0]) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Llegada Est.</div>
                    <div className="font-medium">{trip.fecha_llegada_estimada ? formatDate(trip.fecha_llegada_estimada.split('T')[0]) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Distancia</div>
                    <div className="font-medium">{trip.distancia_km ? `${trip.distancia_km} km` : '—'}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => openEdit(trip)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(trip)}
                    className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editItem ? 'Editar Viaje' : 'Nuevo Viaje'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de Viaje</label>
                  <input name="numero_viaje" type="text" value={form.numero_viaje} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En Curso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Camión</label>
                  <select name="camion_id" value={form.camion_id} onChange={handleChange} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>Unidad {t.numero_unidad} — {t.marca} {t.modelo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chofer</label>
                  <select name="chofer_id" value={form.chofer_id} onChange={handleChange} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {drivers.filter((d) => d.estado === 'activo').map((d) => (
                      <option key={d.id} value={d.id}>{d.numero_empleado} — {d.nombre} {d.apellido_paterno}</option>
                    ))}
                  </select>
                </div>
                {[
                  ['origen', 'Origen *', 'text', true],
                  ['destino', 'Destino *', 'text', true],
                  ['cliente', 'Cliente', 'text', false],
                  ['distancia_km', 'Distancia (km)', 'number', false],
                  ['costo', 'Costo (MXN)', 'number', false],
                ].map(([name, label, type, required]) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input name={name} type={type} value={form[name]} onChange={handleChange} required={required} className={inp} min={type === 'number' ? 0 : undefined} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Salida</label>
                  <input name="fecha_salida" type="datetime-local" value={form.fecha_salida} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Llegada Estimada</label>
                  <input name="fecha_llegada_estimada" type="datetime-local" value={form.fecha_llegada_estimada} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Llegada Real</label>
                  <input name="fecha_llegada_real" type="datetime-local" value={form.fecha_llegada_real} onChange={handleChange} className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
