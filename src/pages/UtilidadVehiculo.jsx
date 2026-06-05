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

const registrosDeTruck = (viajesAdmin, truck) =>
  viajesAdmin.filter((v) => {
    const u = (v.unidad || '').trim().toLowerCase();
    return (
      u === (truck.numero_unidad || '').trim().toLowerCase() ||
      u === (truck.placa || '').trim().toLowerCase()
    );
  });

export default function UtilidadVehiculo() {
  const { trucks, trips, viajesAdmin } = useFleetStore();
  const [selectedTruck, setSelectedTruck] = useState('');

  const resumen = trucks.map((truck) => {
    const viajesCamion = trips.filter((t) => t.camion_id === truck.id);
    const totalIngresos = viajesCamion.reduce((sum, t) => sum + parseMonto(t.costo), 0);
    const registrosAdmin = registrosDeTruck(viajesAdmin, truck);
    const costoServicio = registrosAdmin.reduce((sum, v) => sum + parseMonto(v.costo_servicio), 0);
    const totalGastos = registrosAdmin.reduce((sum, v) => sum + calcGastos(v), 0);
    const utilidad = registrosAdmin.reduce((sum, v) => sum + calcUtilidad(v), 0);
    return { truck, totalIngresos, costoServicio, totalGastos, utilidad, count: viajesCamion.length };
  });

  const viajesFiltrados = selectedTruck
    ? trips.filter((t) => t.camion_id === selectedTruck)
    : [];
  const totalFiltrado = viajesFiltrados.reduce((sum, t) => sum + parseMonto(t.costo), 0);
  const truckSeleccionado = trucks.find((t) => t.id === selectedTruck);

  const truckLabel = (t) => `Unidad ${t.numero_unidad} — ${t.marca} ${t.modelo} (${t.anio})`;

  const totales = resumen.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      totalIngresos: acc.totalIngresos + r.totalIngresos,
      costoServicio: acc.costoServicio + r.costoServicio,
      totalGastos: acc.totalGastos + r.totalGastos,
      utilidad: acc.utilidad + r.utilidad,
    }),
    { count: 0, totalIngresos: 0, costoServicio: 0, totalGastos: 0, utilidad: 0 }
  );

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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Unidad</th>
                <th className="px-5 py-3 text-left">Vehículo</th>
                <th className="px-5 py-3 text-center">Viajes</th>
                <th className="px-5 py-3 text-right">Total Ingresos</th>
                <th className="px-5 py-3 text-right">Costo Serv.</th>
                <th className="px-5 py-3 text-right">Total Gastos</th>
                <th className="px-5 py-3 text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No hay vehículos registrados
                  </td>
                </tr>
              ) : (
                resumen.map(({ truck, totalIngresos, costoServicio, totalGastos, utilidad, count }) => (
                  <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      Unidad {truck.numero_unidad}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {truck.marca} {truck.modelo} ({truck.anio})
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">
                      {formatCurrency(totalIngresos)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {formatCurrency(costoServicio)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">
                      {formatCurrency(totalGastos)}
                    </td>
                    <td className={`px-5 py-3 text-right font-bold ${utilidad >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(utilidad)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {resumen.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={2} className="px-5 py-3 font-bold text-gray-800">Total General</td>
                  <td className="px-5 py-3 text-center font-bold text-gray-800">{totales.count}</td>
                  <td className="px-5 py-3 text-right font-bold text-green-700">{formatCurrency(totales.totalIngresos)}</td>
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

      {/* Filtro por vehículo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Detalle por Vehículo</h2>
        <div className="max-w-sm">
          <label className="block text-xs text-gray-500 mb-1">Seleccionar vehículo</label>
          <select
            value={selectedTruck}
            onChange={(e) => setSelectedTruck(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">— Elige una unidad —</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {truckLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {selectedTruck && (
          <>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {truckSeleccionado ? truckLabel(truckSeleccionado) : ''}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {viajesFiltrados.length} viaje{viajesFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Viajes de Administrativo para esta unidad */}
            {(() => {
              const registrosAdmin = truckSeleccionado
                ? registrosDeTruck(viajesAdmin, truckSeleccionado)
                : [];
              const totalCostoServ = registrosAdmin.reduce((s, v) => s + parseMonto(v.costo_servicio), 0);
              const totalGastosAdmin = registrosAdmin.reduce((s, v) => s + calcGastos(v), 0);
              const totalUtilidadAdmin = registrosAdmin.reduce((s, v) => s + calcUtilidad(v), 0);

              return registrosAdmin.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Viajes de Administrativo
                  </h3>
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
                        {registrosAdmin.map((v) => {
                          const util = calcUtilidad(v);
                          return (
                            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha)}</td>
                              <td className="px-4 py-3 text-gray-700 font-medium">{v.destino || '—'}</td>
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
                          <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totalCostoServ)}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(totalGastosAdmin)}</td>
                          <td className={`px-4 py-3 text-right font-bold text-base ${totalUtilidadAdmin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {formatCurrency(totalUtilidadAdmin)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2 text-center">
                  Esta unidad no tiene viajes en Administrativo
                </p>
              );
            })()}

            {/* Viajes de Trips */}
            {viajesFiltrados.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Viajes Registrados
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left"># Viaje</th>
                        <th className="px-4 py-3 text-left">Origen → Destino</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Fecha Salida</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3 text-right">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viajesFiltrados.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{v.numero_viaje}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {v.origen || '—'} → {v.destino || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{v.cliente || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(v.fecha_salida)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              v.estado === 'completado' ? 'bg-green-100 text-green-700' :
                              v.estado === 'en_curso' ? 'bg-blue-100 text-blue-700' :
                              v.estado === 'cancelado' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {v.estado === 'completado' ? 'Completado' :
                               v.estado === 'en_curso' ? 'En curso' :
                               v.estado === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">
                            {formatCurrency(parseMonto(v.costo))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 font-bold text-gray-800">Total Ingresos</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700 text-base">
                          {formatCurrency(totalFiltrado)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
