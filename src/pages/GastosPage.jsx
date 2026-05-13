import { useState } from 'react';
import { TrendingDown, Plus, Edit, Trash2, X, Eye } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import useAuthStore from '../store/useAuthStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { logActivity } from '../utils/logActivity';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const emptyForm = {
  concepto: '',
  cantidad: '',
  fecha: '',
  notas: '',
};

function parseMonto(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

export default function GastosPage() {
  const { gastos, addGasto, updateGasto, deleteGasto } = useFleetStore();
  const user = useAuthStore((s) => s.user);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const total = gastos.reduce((s, g) => s + parseMonto(g.cantidad), 0);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (g) => { setEditItem(g); setForm({ ...g }); setShowModal(true); };
  const handleDelete = (g) => {
    if (window.confirm(`¿Eliminar gasto "${g.concepto}"?`)) {
      deleteGasto(g.id);
      logActivity(user, 'Eliminó gasto', `${g.concepto} — ${formatCurrency(g.cantidad)}`);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, cantidad: parseMonto(form.cantidad) };
    if (editItem) {
      updateGasto(editItem.id, data);
      logActivity(user, 'Editó gasto', `${data.concepto} — ${formatCurrency(data.cantidad)}`);
    } else {
      addGasto(data);
      logActivity(user, 'Registró gasto', `${data.concepto} — ${formatCurrency(data.cantidad)}`);
    }
    setShowModal(false); setEditItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <p className="text-gray-500 text-sm">Registro y control de egresos</p>
      </div>

      {/* Tarjeta resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center sm:col-span-1">
          <div className="text-xs text-red-500 mb-1">Total Gastos</div>
          <div className="text-2xl font-bold text-red-700">{formatCurrency(total)}</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Registros</div>
          <div className="text-2xl font-bold text-gray-700">{gastos.length}</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Promedio por Gasto</div>
          <div className="text-2xl font-bold text-gray-700">
            {gastos.length > 0 ? formatCurrency(total / gastos.length) : '$0'}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{gastos.length}</span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </button>
        </div>

        {gastos.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No hay gastos registrados</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{g.concepto}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(g.fecha)}</div>
                  {g.notas && <div className="text-xs text-gray-400 italic">{g.notas}</div>}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-bold text-red-600 text-sm whitespace-nowrap">{formatCurrency(g.cantidad)}</span>
                  <button onClick={() => setShowDetail(g)} className="text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openEdit(g)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(g)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ver */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">Detalle de Gasto</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Concepto', showDetail.concepto],
                ['Cantidad', formatCurrency(showDetail.cantidad)],
                ['Fecha', formatDate(showDetail.fecha)],
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

      {/* Modal Agregar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editItem ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Concepto *</label>
                <input name="concepto" type="text" value={form.concepto} onChange={handleChange} required className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad (MXN)</label>
                <input name="cantidad" type="text" value={form.cantidad} onChange={handleChange} placeholder="Ej. 5,000" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={inp} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar Gasto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
