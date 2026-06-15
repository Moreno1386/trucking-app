import { useState } from 'react';
import { CalendarClock, Plus, Edit, Trash2, X, DollarSign, CheckCircle2 } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency } from '../utils/helpers';

const emptyForm = {
  vehiculo: '',
  camion_id: '',
  pago_mensual: '',
  dia_pago: '',
  total_mensualidades: '',
  mensualidades_pagadas: '',
  estado: 'activo',
  notas: '',
};

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

// Calcula plazo / saldo restante / fecha estimada de liquidación
function getPlan(m) {
  const total = parseInt(m.total_mensualidades) || 0;
  const pagadas = parseInt(m.mensualidades_pagadas) || 0;
  const pago = parseFloat(m.pago_mensual) || 0;
  if (!total) return null;
  const restantes = Math.max(total - pagadas, 0);
  const pct = Math.min(Math.round((pagadas / total) * 100), 100);
  const saldoRestante = restantes * pago;
  let liquidacion = null;
  if (restantes > 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + restantes);
    liquidacion = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  }
  return { total, pagadas, restantes, pct, saldoRestante, liquidacion };
}

export default function Mensualidades() {
  const { mensualidades, trucks, addMensualidad, updateMensualidad, deleteMensualidad } = useFleetStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => {
    setEditItem(m);
    setForm({
      ...emptyForm,
      ...m,
      camion_id: m.camion_id || '',
    });
    setShowModal(true);
  };
  const handleDelete = (m) => {
    if (window.confirm(`¿Eliminar la mensualidad de "${m.vehiculo}"?`)) deleteMensualidad(m.id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Al seleccionar un camión de la flota, autocompletar la descripción del vehículo
  const handleTruckSelect = (e) => {
    const id = e.target.value;
    const t = trucks.find((tr) => tr.id === id);
    setForm((p) => ({
      ...p,
      camion_id: id,
      vehiculo: t ? `Unidad ${t.numero_unidad}${t.placa ? '-' + t.placa : ''} — ${t.marca} ${t.modelo}` : p.vehiculo,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vehiculo.trim()) { alert('Indica el vehículo.'); return; }
    const data = {
      vehiculo: form.vehiculo.trim(),
      camion_id: form.camion_id || null,
      pago_mensual: parseFloat(form.pago_mensual) || 0,
      dia_pago: parseInt(form.dia_pago) || null,
      total_mensualidades: parseInt(form.total_mensualidades) || null,
      mensualidades_pagadas: parseInt(form.mensualidades_pagadas) || 0,
      estado: form.estado,
      notas: form.notas,
    };
    if (editItem) updateMensualidad(editItem.id, data);
    else addMensualidad(data);
    setShowModal(false); setEditItem(null);
  };

  const activos = mensualidades.filter((m) => m.estado !== 'liquidado');
  const totalMensual = activos.reduce((sum, m) => sum + (parseFloat(m.pago_mensual) || 0), 0);
  const totalSaldo = mensualidades.reduce((sum, m) => {
    const plan = getPlan(m);
    return sum + (plan ? plan.saldoRestante : 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensualidades de Vehículos</h1>
          <p className="text-gray-500 text-sm">{mensualidades.length} vehículo{mensualidades.length !== 1 ? 's' : ''} con mensualidad</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Vehículo
        </button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-red-50 rounded-lg p-3"><DollarSign className="w-6 h-6 text-red-700" /></div>
          <div>
            <div className="text-xs text-gray-400">Total mensual a pagar</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalMensual)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-yellow-50 rounded-lg p-3"><CalendarClock className="w-6 h-6 text-yellow-700" /></div>
          <div>
            <div className="text-xs text-gray-400">Saldo restante por liquidar</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalSaldo)}</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {mensualidades.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400">
          <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay vehículos con mensualidad registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-4 py-3">Vehículo</th>
                <th className="text-right font-semibold px-4 py-3">Pago mensual</th>
                <th className="text-center font-semibold px-4 py-3">Día de pago</th>
                <th className="text-left font-semibold px-4 py-3">Progreso del crédito</th>
                <th className="text-right font-semibold px-4 py-3">Saldo restante</th>
                <th className="text-center font-semibold px-4 py-3">Estado</th>
                <th className="text-center font-semibold px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mensualidades.map((m) => {
                const plan = getPlan(m);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.vehiculo}</div>
                      {m.notas && <div className="text-xs text-gray-400 mt-0.5">{m.notas}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(m.pago_mensual)}</td>
                    <td className="px-4 py-3 text-center">
                      {m.dia_pago ? <span className="inline-block bg-red-50 text-red-700 font-bold rounded-md px-2 py-0.5">{m.dia_pago}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      {plan ? (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{plan.pagadas}/{plan.total} pagadas</span>
                            <span>{plan.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${plan.pct}%` }} />
                          </div>
                          {plan.liquidacion && <div className="text-xs text-gray-400 mt-1">Liquida ~{plan.liquidacion}</div>}
                        </div>
                      ) : <span className="text-gray-300 text-xs">Sin plazo definido</span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {plan ? <span className={plan.saldoRestante > 0 ? 'font-semibold text-gray-900' : 'font-semibold text-green-600'}>{formatCurrency(plan.saldoRestante)}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.estado === 'liquidado'
                        ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium rounded-full px-2 py-0.5"><CheckCircle2 className="w-3 h-3" />Liquidado</span>
                        : <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">Activo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(m)} title="Editar" className="text-blue-600 hover:bg-blue-50 rounded-lg p-1.5 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(m)} title="Eliminar" className="text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Editar' : 'Nuevo'} Vehículo con Mensualidad</h2>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Camión de la flota (opcional)</label>
                  <select name="camion_id" value={form.camion_id} onChange={handleTruckSelect} className={inp}>
                    <option value="">— Seleccionar —</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>Unidad {t.numero_unidad}{t.placa ? '-' + t.placa : ''} — {t.marca} {t.modelo}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vehículo *</label>
                  <input name="vehiculo" type="text" value={form.vehiculo} onChange={handleChange} required placeholder="Ej. Unidad 12-78BA9V — Kenworth T680" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pago mensual (MXN) *</label>
                  <input name="pago_mensual" type="number" min="0" step="0.01" value={form.pago_mensual} onChange={handleChange} required className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Día de pago (1–31)</label>
                  <input name="dia_pago" type="number" min="1" max="31" value={form.dia_pago} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total de mensualidades (plazo)</label>
                  <input name="total_mensualidades" type="number" min="0" value={form.total_mensualidades} onChange={handleChange} placeholder="Ej. 48" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mensualidades pagadas</label>
                  <input name="mensualidades_pagadas" type="number" min="0" value={form.mensualidades_pagadas} onChange={handleChange} placeholder="Ej. 12" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className={inp}>
                    <option value="activo">Activo</option>
                    <option value="liquidado">Liquidado</option>
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
