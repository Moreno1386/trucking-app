import { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, X, AlertTriangle, Phone } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { statusClass, statusLabel, formatDate, getDaysRemaining, daysRemainingClass } from '../utils/helpers';

const emptyForm = {
  numero_empleado: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  licencia_numero: '',
  licencia_tipo: 'B',
  licencia_vencimiento: '',
  telefono: '',
  email: '',
  direccion: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  estado: 'activo',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

function DriverCard({ driver, onEdit, onDelete }) {
  const days = getDaysRemaining(driver.licencia_vencimiento);
  const licExpired = days !== null && days < 0;
  const licSoon = days !== null && days >= 0 && days <= 30;
  const fullName = `${driver.nombre} ${driver.apellido_paterno} ${driver.apellido_materno}`.trim();
  const initials = [driver.nombre[0], driver.apellido_paterno[0]].join('').toUpperCase();

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${licExpired ? 'border-red-200' : 'border-gray-100'}`}>
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">{fullName}</div>
            <div className="text-xs text-gray-400">{driver.numero_empleado}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass(driver.estado)}`}>
          {statusLabel[driver.estado]}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-gray-600 mb-3">
        {driver.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{driver.telefono}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
          <div><span className="text-gray-400">Licencia:</span> {driver.licencia_numero || '—'}</div>
          <div><span className="text-gray-400">Tipo:</span> {driver.licencia_tipo}</div>
          <div><span className="text-gray-400">Ingreso:</span> {formatDate(driver.fecha_ingreso)}</div>
          <div><span className="text-gray-400">Email:</span> {driver.email || '—'}</div>
        </div>
      </div>

      {/* License expiry */}
      {driver.licencia_vencimiento && (
        <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-3 ${daysRemainingClass(days)}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {licExpired
            ? `Licencia vencida: ${formatDate(driver.licencia_vencimiento)}`
            : licSoon
            ? `Vence en ${days} días (${formatDate(driver.licencia_vencimiento)})`
            : `Vence: ${formatDate(driver.licencia_vencimiento)}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <button
          onClick={() => onEdit(driver)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={() => onDelete(driver)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </div>
  );
}

export default function Drivers() {
  const { drivers, addDriver, updateDriver, deleteDriver } = useFleetStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const fullName = `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno}`.toLowerCase();
    const matchSearch =
      !q ||
      fullName.includes(q) ||
      d.numero_empleado.toLowerCase().includes(q) ||
      (d.licencia_numero && d.licencia_numero.toLowerCase().includes(q));
    const matchFilter = filter === 'Todos' || d.estado === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (d) => {
    setEditItem(d);
    setForm({ ...d });
    setShowModal(true);
  };
  const handleDelete = (d) => {
    if (window.confirm(`¿Eliminar a ${d.nombre} ${d.apellido_paterno}?`)) {
      deleteDriver(d.id);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const DATE_FIELDS = ['licencia_vencimiento', 'fecha_nacimiento', 'fecha_ingreso'];
  const sanitize = (data) => {
    const out = { ...data };
    DATE_FIELDS.forEach((f) => { if (out[f] === '') out[f] = null; });
    return out;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = sanitize(form);
    if (editItem) {
      updateDriver(editItem.id, data);
    } else {
      addDriver(data);
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Choferes</h1>
          <p className="text-gray-500 text-sm">{drivers.length} choferes registrados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Chofer
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, # empleado o licencia..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['Todos', 'activo', 'inactivo'].map((f) => (
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
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron choferes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <DriverCard key={d.id} driver={d} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editItem ? 'Editar Chofer' : 'Nuevo Chofer'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['numero_empleado', 'Número Empleado *', 'text', true],
                  ['nombre', 'Nombre(s) *', 'text', true],
                  ['apellido_paterno', 'Apellido Paterno', 'text', false],
                  ['apellido_materno', 'Apellido Materno', 'text', false],
                  ['licencia_numero', 'Número Licencia', 'text', false],
                  ['licencia_vencimiento', 'Vencimiento Licencia', 'date', false],
                  ['telefono', 'Teléfono', 'tel', false],
                  ['email', 'Email', 'email', false],
                  ['fecha_nacimiento', 'Fecha Nacimiento', 'date', false],
                  ['fecha_ingreso', 'Fecha Ingreso', 'date', false],
                  ['contacto_emergencia_nombre', 'Contacto Emergencia', 'text', false],
                  ['contacto_emergencia_telefono', 'Tel. Emergencia', 'tel', false],
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
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Licencia</label>
                  <select name="licencia_tipo" value={form.licencia_tipo} onChange={handleChange} className={inp}>
                    {['A', 'B', 'C', 'D', 'E'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                  <input name="direccion" type="text" value={form.direccion} onChange={handleChange} className={inp} />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={inp} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">
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
