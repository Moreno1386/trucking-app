import { useState } from 'react';
import { Wrench, Plus, Search, Edit, Trash2, X } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { statusClass, statusLabel, formatDate, formatCurrency, formatNumber } from '../utils/helpers';

const emptyForm = {
  camion_id: '',
  tipo: 'preventivo',
  descripcion: '',
  fecha: '',
  taller: '',
  costo: '',
  kilometraje_al_servicio: '',
  proximo_servicio_km: '',
  estado: 'pendiente',
  notas: '',
};

const TIPOS = ['preventivo', 'correctivo', 'cambio_aceite', 'llantas', 'frenos', 'otro'];
const TIPO_LABELS = {
  preventivo: 'Preventivo', correctivo: 'Correctivo', cambio_aceite: 'Cambio de Aceite',
  llantas: 'Llantas', frenos: 'Frenos', otro: 'Otro',
};
const TIPO_COLORS = {
  preventivo: 'bg-blue-100 text-blue-700', correctivo: 'bg-orange-100 text-orange-700',
  cambio_aceite: 'bg-yellow-100 text-yellow-700', llantas: 'bg-purple-100 text-purple-700',
  frenos: 'bg-red-100 text-red-700', otro: 'bg-gray-100 text-gray-700',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function Maintenance() {
  const { maintenance, trucks, addMaintenance, updateMaintenance, deleteMaintenance } = useFleetStore();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const getTruck = (id) => trucks.find((t) => t.id === id);

  const filtered = maintenance.filter((m) => {
    const q = search.toLowerCase();
    const truck = getTruck(m.camion_id);
    const matchSearch =
      !q ||
      (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
      (m.taller && m.taller.toLowerCase().includes(q)) ||
      (truck && `unidad ${truck.numero_unidad}`.includes(q));
    const matchTipo = filterTipo === 'Todos' || m.tipo === filterTipo;
    const matchEstado = filterEstado === 'Todos' || m.estado === filterEstado;
    return matchSearch && matchTipo && matchEstado;
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => { setEditItem(m); setForm({ ...m }); setShowModal(true); };
  const handleDelete = (m) => {
    const truck = getTruck(m.camion_id);
    if (window.confirm(`¿Eliminar registro de mantenimiento?`)) deleteMaintenance(m.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      costo: parseFloat(form.costo) || 0,
      kilometraje_al_servicio: parseFloat(form.kilometraje_al_servicio) || 0,
      proximo_servicio_km: parseFloat(form.proximo_servicio_km) || 0,
    };
    if (editItem) updateMaintenance(editItem.id, data);
    else addMaintenance(data);
    setShowModal(false); setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-500 text-sm">{maintenance.length} registros</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Agregar Mantenimiento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descripción, taller o unidad..." className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="Todos">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="Todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completado">Completado</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{maintenance.length === 0 ? 'No hay registros de mantenimiento' : 'Sin resultados'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const truck = getTruck(m.camion_id);
            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <Wrench className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{m.descripcion}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLORS[m.tipo] || 'bg-gray-100 text-gray-600'}`}>
                          {TIPO_LABELS[m.tipo] || m.tipo}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {truck ? `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo}` : 'Unidad no asignada'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(m.estado)}`}>
                    {statusLabel[m.estado]}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                  <div><div className="text-gray-400">Fecha</div><div className="font-medium">{formatDate(m.fecha)}</div></div>
                  <div><div className="text-gray-400">Taller</div><div className="font-medium">{m.taller || '—'}</div></div>
                  <div><div className="text-gray-400">Costo</div><div className="font-medium">{formatCurrency(m.costo)}</div></div>
                  <div><div className="text-gray-400">Km al servicio</div><div className="font-medium">{formatNumber(m.kilometraje_al_servicio)}</div></div>
                  {m.proximo_servicio_km > 0 && (
                    <div><div className="text-gray-400">Próximo servicio</div><div className="font-medium">{formatNumber(m.proximo_servicio_km)} km</div></div>
                  )}
                </div>

                {m.notas && <p className="text-xs text-gray-500 mt-2 italic">{m.notas}</p>}

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button onClick={() => openEdit(m)} className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"><Edit className="w-3.5 h-3.5" /> Editar</button>
                  <button onClick={() => handleDelete(m)} className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
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
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Editar' : 'Nuevo'} Mantenimiento</h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Camión *</label>
                  <select name="camion_id" value={form.camion_id} onChange={handleChange} required className={inp}>
                    <option value="">— Seleccionar —</option>
                    {trucks.map((t) => <option key={t.id} value={t.id}>Unidad {t.numero_unidad} — {t.marca} {t.modelo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className={inp}>
                    {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción *</label>
                  <input name="descripcion" type="text" value={form.descripcion} onChange={handleChange} required className={inp} />
                </div>
                {[
                  ['fecha', 'Fecha', 'date'],
                  ['taller', 'Taller', 'text'],
                  ['costo', 'Costo (MXN)', 'number'],
                  ['kilometraje_al_servicio', 'Km al Servicio', 'number'],
                  ['proximo_servicio_km', 'Próximo Servicio (km)', 'number'],
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input name={name} type={type} value={form[name]} onChange={handleChange} className={inp} min={type === 'number' ? 0 : undefined} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                  </select>
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
