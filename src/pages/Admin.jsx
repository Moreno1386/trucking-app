import { useState } from 'react';
import { FileText, TrendingDown, Plus, Edit, Trash2, X, Eye } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const emptyFactura = {
  numero_factura: '',
  cliente: '',
  fecha: '',
  monto: '',
  estado: 'pendiente',
  notas: '',
};

const emptyGasto = {
  concepto: '',
  cantidad: '',
  fecha: '',
  notas: '',
};

function parseMonto(val) {
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

// ── Sección Facturas ──────────────────────────────────────────
function Facturas() {
  const { facturas, addFactura, updateFactura, deleteFactura } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyFactura);

  const total = facturas.reduce((s, f) => s + parseMonto(f.monto), 0);
  const pagadas = facturas.filter((f) => f.estado === 'pagada').reduce((s, f) => s + parseMonto(f.monto), 0);
  const pendientes = facturas.filter((f) => f.estado === 'pendiente').reduce((s, f) => s + parseMonto(f.monto), 0);

  const openAdd = () => { setEditItem(null); setForm(emptyFactura); setShowModal(true); };
  const openEdit = (f) => { setEditItem(f); setForm({ ...f }); setShowModal(true); };
  const handleDelete = (f) => {
    if (window.confirm(`¿Eliminar factura ${f.numero_factura}?`)) deleteFactura(f.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, monto: parseMonto(form.monto) };
    if (editItem) updateFactura(editItem.id, data);
    else addFactura(data);
    setShowModal(false); setEditItem(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Facturas</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{facturas.length}</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva Factura
        </button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b bg-gray-50">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(total)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Pagadas</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(pagadas)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Pendientes</div>
          <div className="text-lg font-bold text-red-600">{formatCurrency(pendientes)}</div>
        </div>
      </div>

      {/* Lista */}
      {facturas.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">No hay facturas registradas</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {facturas.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{f.numero_factura}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {f.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{f.cliente || '—'} · {formatDate(f.fecha)}</div>
                {f.notas && <div className="text-xs text-gray-400 italic">{f.notas}</div>}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatCurrency(f.monto)}</span>
                <button onClick={() => setShowDetail(f)} className="text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                <button onClick={() => openEdit(f)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(f)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ver */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">Factura {showDetail.numero_factura}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Número Factura', showDetail.numero_factura],
                ['Cliente', showDetail.cliente || '—'],
                ['Fecha', formatDate(showDetail.fecha)],
                ['Monto', formatCurrency(showDetail.monto)],
                ['Estado', showDetail.estado === 'pagada' ? 'Pagada' : 'Pendiente'],
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editItem ? 'Editar Factura' : 'Nueva Factura'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número Factura *</label>
                  <input name="numero_factura" type="text" value={form.numero_factura} onChange={handleChange} required className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                  <input name="cliente" type="text" value={form.cliente} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                  <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto (MXN)</label>
                  <input name="monto" type="text" value={form.monto} onChange={handleChange} placeholder="Ej. 48,000" className={inp} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={inp} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sección Gastos ────────────────────────────────────────────
function Gastos() {
  const { gastos, addGasto, updateGasto, deleteGasto } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyGasto);

  const total = gastos.reduce((s, g) => s + parseMonto(g.cantidad), 0);

  const openAdd = () => { setEditItem(null); setForm(emptyGasto); setShowModal(true); };
  const openEdit = (g) => { setEditItem(g); setForm({ ...g }); setShowModal(true); };
  const handleDelete = (g) => {
    if (window.confirm(`¿Eliminar gasto "${g.concepto}"?`)) deleteGasto(g.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, cantidad: parseMonto(form.cantidad) };
    if (editItem) updateGasto(editItem.id, data);
    else addGasto(data);
    setShowModal(false); setEditItem(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{gastos.length}</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </button>
      </div>

      {/* Total */}
      <div className="p-5 border-b bg-gray-50">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Total Gastos</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(total)}</div>
        </div>
      </div>

      {/* Lista */}
      {gastos.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">No hay gastos registrados</div>
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

      {/* Modal */}
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
                <button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Admin() {
  const { facturas, gastos } = useFleetStore();

  const totalFacturas = facturas.reduce((s, f) => s + parseMonto(f.monto), 0);
  const totalGastos = gastos.reduce((s, g) => s + parseMonto(g.cantidad), 0);
  const balance = totalFacturas - totalGastos;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administrativo</h1>
        <p className="text-gray-500 text-sm">Control de facturas y gastos</p>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <div className="text-xs text-blue-500 mb-1">Total Facturado</div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(totalFacturas)}</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <div className="text-xs text-red-500 mb-1">Total Gastos</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(totalGastos)}</div>
        </div>
        <div className={`border rounded-xl p-4 text-center ${balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`text-xs mb-1 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>Balance</div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Secciones */}
      <Facturas />
      <Gastos />
    </div>
  );
}
