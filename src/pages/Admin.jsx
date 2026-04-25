import { useState } from 'react';
import { FileText, TrendingDown, Plus, Edit, Trash2, X, Eye, Truck } from 'lucide-react';
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
    if (window.confirm(`¿Eliminar gasto ${f.numero_factura}?`)) deleteFactura(f.id);
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
          <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{facturas.length}</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Gasto
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
              <h3 className="font-bold text-gray-900">Gasto {showDetail.numero_factura}</h3>
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
              <h3 className="font-bold text-gray-900">{editItem ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
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
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar Gasto'}</button>
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

// ── Sección Viajes Admin ──────────────────────────────────────
const emptyViaje = {
  fecha: '',
  destino: '',
  operador: '',
  unidad: '',
  costo_servicio: '',
  diesel: '',
  casetas_efectivo: '',
  casetas_televia: '',
  otros_gastos: '',
  pago_operador: '',
};

function calcUtilidad(v) {
  return (
    parseMonto(v.costo_servicio) -
    parseMonto(v.diesel) -
    parseMonto(v.casetas_efectivo) -
    parseMonto(v.casetas_televia) -
    parseMonto(v.otros_gastos) -
    parseMonto(v.pago_operador)
  );
}

function ViajesAdmin() {
  const { viajesAdmin, addViajeAdmin, updateViajeAdmin, deleteViajeAdmin } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyViaje);

  const totalCosto = viajesAdmin.reduce((s, v) => s + parseMonto(v.costo_servicio), 0);
  const totalGastos = viajesAdmin.reduce((s, v) =>
    s + parseMonto(v.diesel) + parseMonto(v.casetas_efectivo) + parseMonto(v.casetas_televia) + parseMonto(v.otros_gastos) + parseMonto(v.pago_operador), 0);
  const totalUtilidad = viajesAdmin.reduce((s, v) => s + calcUtilidad(v), 0);

  const openAdd = () => { setEditItem(null); setForm(emptyViaje); setShowModal(true); };
  const openEdit = (v) => { setEditItem(v); setForm({ ...v }); setShowModal(true); };
  const handleDelete = (v) => {
    if (window.confirm(`¿Eliminar viaje a "${v.destino}"?`)) deleteViajeAdmin(v.id);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      costo_servicio: parseMonto(form.costo_servicio),
      diesel: parseMonto(form.diesel),
      casetas_efectivo: parseMonto(form.casetas_efectivo),
      casetas_televia: parseMonto(form.casetas_televia),
      otros_gastos: parseMonto(form.otros_gastos),
      pago_operador: parseMonto(form.pago_operador),
    };
    if (editItem) updateViajeAdmin(editItem.id, data);
    else addViajeAdmin(data);
    setShowModal(false); setEditItem(null);
  };

  const utilidadPreview = calcUtilidad(form);

  const thClass = 'px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-sm text-gray-800 whitespace-nowrap';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Registro de Viajes</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{viajesAdmin.length}</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Viaje
        </button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b bg-orange-50">
        <div className="text-center">
          <div className="text-xs text-orange-500 mb-1">Total Costo Servicio</div>
          <div className="text-lg font-bold text-orange-700">{formatCurrency(totalCosto)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-red-500 mb-1">Total Gastos</div>
          <div className="text-lg font-bold text-red-700">{formatCurrency(totalGastos)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-green-500 mb-1">Total Utilidad</div>
          <div className="text-lg font-bold text-green-700">{formatCurrency(totalUtilidad)}</div>
        </div>
      </div>

      {/* Tabla */}
      {viajesAdmin.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">No hay viajes registrados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-orange-700">
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Destino</th>
                <th className={thClass}>Operador</th>
                <th className={thClass}>Unidad</th>
                <th className={`${thClass} text-right`}>Costo Serv.</th>
                <th className={`${thClass} text-right`}>Diesel</th>
                <th className={`${thClass} text-right`}>Casetas Efectivo</th>
                <th className={`${thClass} text-right`}>Casetas Televia</th>
                <th className={`${thClass} text-right`}>Otros Gastos</th>
                <th className={`${thClass} text-right`}>Pago Operador</th>
                <th className={`${thClass} text-right`}>Utilidad</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viajesAdmin.map((v) => {
                const util = calcUtilidad(v);
                return (
                  <tr key={v.id} className="hover:bg-orange-50 transition-colors">
                    <td className={tdClass}>{formatDate(v.fecha)}</td>
                    <td className={`${tdClass} font-medium`}>{v.destino}</td>
                    <td className={tdClass}>{v.operador}</td>
                    <td className={tdClass}><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{v.unidad}</span></td>
                    <td className={`${tdClass} text-right`}>{formatCurrency(v.costo_servicio)}</td>
                    <td className={`${tdClass} text-right text-red-600`}>{formatCurrency(v.diesel)}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.casetas_efectivo) > 0 ? formatCurrency(v.casetas_efectivo) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.casetas_televia) > 0 ? formatCurrency(v.casetas_televia) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{parseMonto(v.otros_gastos) > 0 ? formatCurrency(v.otros_gastos) : <span className="text-gray-300">—</span>}</td>
                    <td className={`${tdClass} text-right`}>{formatCurrency(v.pago_operador)}</td>
                    <td className={`${tdClass} text-right font-bold text-green-700`}>{formatCurrency(util)}</td>
                    <td className={`${tdClass}`}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(v)} className="text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(v)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(v)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ver */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">Viaje — {showDetail.destino}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              {[
                ['Fecha', formatDate(showDetail.fecha)],
                ['Destino', showDetail.destino],
                ['Operador', showDetail.operador],
                ['Unidad', showDetail.unidad],
                ['Costo Servicio', formatCurrency(showDetail.costo_servicio)],
                ['Diesel', formatCurrency(showDetail.diesel)],
                ['Casetas Efectivo', formatCurrency(showDetail.casetas_efectivo)],
                ['Casetas Televia', formatCurrency(showDetail.casetas_televia)],
                ['Otros Gastos', formatCurrency(showDetail.otros_gastos)],
                ['Pago Operador', formatCurrency(showDetail.pago_operador)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-medium text-gray-900">{v}</div>
                </div>
              ))}
              <div className="col-span-2 bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="text-xs text-green-600">Utilidad</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(calcUtilidad(showDetail))}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{editItem ? 'Editar Viaje' : 'Nuevo Viaje'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
                  <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destino *</label>
                  <input name="destino" type="text" value={form.destino} onChange={handleChange} required className={inp} placeholder="Ej. HIROTEC" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
                  <input name="operador" type="text" value={form.operador} onChange={handleChange} className={inp} placeholder="Ej. LUIS REYES" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
                  <input name="unidad" type="text" value={form.unidad} onChange={handleChange} className={inp} placeholder="Ej. 58AZ3W" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Costo Servicio ($)</label>
                  <input name="costo_servicio" type="text" value={form.costo_servicio} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Diesel ($)</label>
                  <input name="diesel" type="text" value={form.diesel} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Casetas Efectivo ($)</label>
                  <input name="casetas_efectivo" type="text" value={form.casetas_efectivo} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Casetas Televia ($)</label>
                  <input name="casetas_televia" type="text" value={form.casetas_televia} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Otros Gastos ($)</label>
                  <input name="otros_gastos" type="text" value={form.otros_gastos} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pago Operador ($)</label>
                  <input name="pago_operador" type="text" value={form.pago_operador} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
              </div>
              {/* Utilidad en tiempo real */}
              <div className={`rounded-lg p-4 border ${utilidadPreview >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-xs text-gray-500 mb-1">Utilidad calculada automáticamente</div>
                <div className={`text-2xl font-bold ${utilidadPreview >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(utilidadPreview)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Costo Serv. − Diesel − Casetas Ef. − Casetas Tele. − Otros Gastos − Pago Operador</div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">{editItem ? 'Actualizar' : 'Guardar'}</button>
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
  const { facturas, gastos, viajesAdmin } = useFleetStore();

  const totalFacturas = facturas.reduce((s, f) => s + parseMonto(f.monto), 0);
  const totalGastos = gastos.reduce((s, g) => s + parseMonto(g.cantidad), 0);
  const balance = totalFacturas - totalGastos;
  const totalUtilidadViajes = viajesAdmin.reduce((s, v) => s + calcUtilidad(v), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administrativo</h1>
        <p className="text-gray-500 text-sm">Control de facturas, gastos y viajes</p>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <div className="text-xs text-orange-500 mb-1">Utilidad Viajes</div>
          <div className="text-xl font-bold text-orange-700">{formatCurrency(totalUtilidadViajes)}</div>
        </div>
      </div>

      {/* Secciones */}
      <ViajesAdmin />
      <Facturas />
      <Gastos />
    </div>
  );
}
