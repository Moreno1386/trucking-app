import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const parseMonto = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;

const calcGastos = (v) =>
  parseMonto(v.diesel) +
  parseMonto(v.casetas_efectivo) +
  parseMonto(v.casetas_televia) +
  parseMonto(v.otros_gastos) +
  parseMonto(v.pago_operador);

const calcUtilidad = (v) => parseMonto(v.costo_servicio) - calcGastos(v);

export default function UtilidadVehiculo() {
  const { viajesAdmin } = useFleetStore();
  const [selectedUnidad, setSelectedUnidad] = useState('');

  // Agrupar por unidad directamente desde viajesAdmin
  const unidadesMap = {};
  viajesAdmin.forEach((v) => {
    const key = (v.unidad || '').trim().toUpperCase();
    if (!key) return;
    if (!unidadesMap[key]) {
      unidadesMap[key] = { unidad: key, viajes: [], costoServicio: 0, totalGastos: 0, utilidad: 0 };
    }
    unidadesMap[key].viajes.push(v);
    unidadesMap[key].costoServicio += parseMonto(v.costo_servicio);
    unidadesMap[key].totalGastos += calcGastos(v);
    unidadesMap[key].utilidad += calcUtilidad(v);
  });

  const resumen = Object.values(unidadesMap).sort((a, b) =>
    a.unidad.localeCompare(b.unidad)
  );

  const totales = resumen.reduce(
    (acc, r) => ({
      count: acc.count + r.viajes.length,
      costoServicio: acc.costoServicio + r.costoServicio,
      totalGastos: acc.totalGastos + r.totalGastos,
      utilidad: acc.utilidad + r.utilidad,
    }),
    { count: 0, costoServicio: 0, totalGastos: 0, utilidad: 0 }
  );

  const detalle = selectedUnidad ? unidadesMap[selectedUnidad] : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilidad por Vehículo</h1>
        <p className="text-gray-500 text-sm">Ingresos, gastos y utilidad neta agrupados por unidad</p>
      </div>

      {/* Tabla resumen */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-800">Resumen General</h2>
          <span className="ml-auto text-xs text-gray-400">{resumen.length} unidades · {totales.count} viajes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Unidad</th>
                <th className="px-5 py-3 text-center">Viajes</th>
                <th className="px-5 py-3 text-right">Costo Serv.</th>
                <th className="px-5 py-3 text-right">Total Gastos</th>
                <th className="px-5 py-3 text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No hay viajes registrados en Administrativo
                  </td>
                </tr>
              ) : (
                resumen.map((r) => (
                  <tr key={r.unidad} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900 font-mono">{r.unidad}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{r.viajes.length}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(r.costoServicio)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">{formatCurrency(r.totalGastos)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${r.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(r.utilidad)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {resumen.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-5 py-3 font-bold text-gray-800">Total General</td>
                  <td className="px-5 py-3 text-center font-bold text-gray-800">{totales.count}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">{formatCurrency(totales.costoServicio)}</td>
                  <td className="px-5 py-3 text-right font-bold text-red-600">{formatCurrency(totales.totalGastos)}</td>
                  <td className={`px-5 py-3 text-right font-bold text-base ${totales.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(totales.utilidad)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detalle por unidad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Detalle por Vehículo</h2>
        <div className="max-w-sm">
          <label className="block text-xs text-gray-500 mb-1">Seleccionar unidad</label>
          <select
            value={selectedUnidad}
            onChange={(e) => setSelectedUnidad(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">— Elige una unidad —</option>
            {resumen.map((r) => (
              <option key={r.unidad} value={r.unidad}>
                {r.unidad} — {r.viajes.length} viaje{r.viajes.length !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {detalle && (
          <>
            <div className="flex flex-wrap gap-4 py-2 border-b border-gray-100">
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Viajes</div>
                <div className="font-bold text-gray-800">{detalle.viajes.length}</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Costo Serv.</div>
                <div className="font-bold text-gray-700">{formatCurrency(detalle.costoServicio)}</div>
              </div>
              <div className="bg-red-50 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-500">Total Gastos</div>
                <div className="font-bold text-red-600">{formatCurrency(detalle.totalGastos)}</div>
              </div>
              <div className={`rounded-lg px-4 py-2 text-center ${detalle.utilidad >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-xs text-gray-500">Utilidad</div>
                <div className={`font-bold ${detalle.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(detalle.utilidad)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Destino</th>
                    <th className="px-4 py-3 text-left">Operador</th>
                    <th className="px-4 py-3 text-right">Costo Serv.</th>
                    <th className="px-4 py-3 text-right">Gastos</th>
                    <th className="px-4 py-3 text-right">Utilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalle.viajes.map((v) => {
                    const util = calcUtilidad(v);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{v.destino || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{v.operador || '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(parseMonto(v.costo_servicio))}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(calcGastos(v))}</td>
                        <td className={`px-4 py-3 text-right font-bold ${util >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {formatCurrency(util)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold text-gray-800">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(detalle.costoServicio)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(detalle.totalGastos)}</td>
                    <td className={`px-4 py-3 text-right font-bold text-base ${detalle.utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(detalle.utilidad)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
