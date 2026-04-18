import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, X, Calendar, Shield, Eye } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatDate, formatCurrency, getDaysRemaining, daysRemainingClass } from '../utils/helpers';

const emptyForm = {
  aseguradora: '',
  numero_poliza: '',
  camion_id: '',
  tipo_cobertura: 'Amplia',
  fecha_inicio: '',
  fecha_vencimiento: '',
  prima_anual: '',
  suma_asegurada: '',
  estado: 'activo',
  notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function Insurance() {
  const { insurances, trucks, addInsurance, updateInsurance, deleteInsurance } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const getTruck = (id) => trucks.find((t) => t.id === id);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (i) => { setEditItem(i); setForm({ ...i }); setShowModal(true); };
  const handleDelete = (i) => {
    if (window.confirm(`¿Eliminar póliza ${i.numero_poliza}?`)) deleteInsurance(i.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      prima_anual: parseFloat(form.prima_anual) || 0,
      suma_asegurada: parseFloat(form.suma_asegurada) || 0,
    };
    if (editItem) updateInsurance(editItem.id, data);
    else addInsurance(data);
    setShowModal(false); setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seguros</h1>
          <p className="text-gray-500 text-sm">{insurances.length} pólizas registradas</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Póliza
        </button>
      </div>

      {/* Cards */}
      {insurances.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay pólizas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {insurances.map((ins) => {
            const truck = getTruck(ins.camion_id);
            const days = getDaysRemaining(ins.fecha_vencimiento);
            const daysBadge = daysRemainingClass(days);

            return (
              <div key={ins.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-2.5">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{ins.aseguradora}</div>
                      <div className="text-xs text-gray-400">Póliza {ins.numero_poliza}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${daysBadge}`}>
                    {days === null ? '—' : days < 0 ? `Vencida` : days === 0 ? 'Hoy' : `${days} días`}
                  </span>
                </div>

                {/* Truck */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm">
                  <span className="text-gray-500 text-xs">Unidad: </span>
                  <span className="font-medium text-gray-800">
                    {truck ? `Unidad ${truck.numero_unidad} — ${truck.marca} ${truck.modelo} ${truck.anio}` : 'No asignada'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 mb-3">
                  <div><div className="text-gray-400">Cobertura</div><div className="font-medium">{ins.tipo_cobertura}</div></div>
                  <div><div className="text-gray-400">Estado</div><div className="font-medium capitalize">{ins.estado}</div></div>
                  <div>
                    <div className="text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Inicio</div>
                    <div className="font-medium">{formatDate(ins.fecha_inicio)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Vencimiento</div>
                    <div className="font-medium">{formatDate(ins.fecha_vencimiento)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Prima Anual</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(ins.prima_anual)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Suma Asegurada</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(ins.suma_asegurada)}</div>
                  </div>
                </div>

                {ins.notas && <p className="text-xs text-gray-500 italic mb-3">{ins.notas}</p>}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button onClick={() => setShowDetail({ ins, truck })} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg py-1.5 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button onClick={() => openEdit(ins)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => handleDelete(ins)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{showDetail.ins.aseguradora} — Póliza {showDetail.ins.numero_poliza}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm max-h-[70vh] overflow-y-auto">
              {[
                ['Aseguradora', showDetail.ins.aseguradora],
                ['No. Póliza', showDetail.ins.numero_poliza],
                ['Cobertura', showDetail.ins.tipo_cobertura || '—'],
                ['Estado', showDetail.ins.estado],
                ['Unidad', showDetail.truck ? `Unidad ${showDetail.truck.numero_unidad} — ${showDetail.truck.marca} ${showDetail.truck.modelo}` : '—'],
                ['Placa', showDetail.truck?.placa || '—'],
                ['Fecha Inicio', formatDate(showDetail.ins.fecha_inicio)],
                ['Fecha Vencimiento', formatDate(showDetail.ins.fecha_vencimiento)],
                ['Prima Anual', formatCurrency(showDetail.ins.prima_anual)],
                ['Suma Asegurada', formatCurrency(showDetail.ins.suma_asegurada)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-medium text-gray-900">{v}</div>
                </div>
              ))}
              {showDetail.ins.notas && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400">Notas</div>
                  <div className="text-gray-700">{showDetail.ins.notas}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Editar' : 'Nueva'} Póliza</h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['aseguradora', 'Aseguradora *', 'text', true],
                  ['numero_poliza', 'Número de Póliza *', 'text', true],
                  ['tipo_cobertura', 'Tipo de Cobertura', 'text', false],
                  ['fecha_inicio', 'Fecha Inicio', 'date', false],
                  ['fecha_vencimiento', 'Fecha Vencimiento', 'date', false],
                  ['prima_anual', 'Prima Anual (MXN)', 'number', false],
                  ['suma_asegurada', 'Suma Asegurada (MXN)', 'number', false],
                ].map(([name, label, type, required]) => (
                  <div key={name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input name={name} type={type} value={form[name]} onChange={handleChange} required={required} className={inp} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Camión</label>
                  <select name="camion_id" value={form.camion_id} onChange={handleChange} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {trucks.map((t) => <option key={t.id} value={t.id}>Unidad {t.numero_unidad} — {t.marca} {t.modelo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="activo">Activo</option>
                    <option value="vencido">Vencido</option>
                    <option value="cancelado">Cancelado</option>
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
