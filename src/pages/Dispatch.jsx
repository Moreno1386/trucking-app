import { useState } from 'react';
import {
  ClipboardList, UserCheck, UserX, CheckCircle, Clock,
  ChevronRight, AlertCircle, Truck,
} from 'lucide-react';
import useFleetStore from '../store/useFleetStore';
import { formatDate } from '../utils/helpers';

export default function Dispatch() {
  const { drivers, trucks, turns, addToTurnList, removeFromTurnList, assignNextTrip, markDriverUnavailable } = useFleetStore();
  const [lastAssigned, setLastAssigned] = useState(null);

  const activeTurns = turns
    .filter((t) => t.estado === 'esperando')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const assignedTurns = turns.filter((t) => t.estado === 'asignado');

  const driversInQueue = new Set(activeTurns.map((t) => t.driver_id));

  const activeDrivers = drivers.filter((d) => d.estado === 'activo');
  const availableDrivers = activeDrivers.filter((d) => !driversInQueue.has(d.id));
  const unavailableCount = activeDrivers.length - driversInQueue.size;

  const getDriver = (id) => drivers.find((d) => d.id === id);
  const fullName = (d) =>
    d ? `${d.nombre} ${d.apellido_paterno} ${d.apellido_materno || ''}`.trim() : '—';

  const handleAssignNext = () => {
    const driverId = assignNextTrip();
    if (driverId) {
      const d = getDriver(driverId);
      setLastAssigned(d);
    }
  };

  const handleAdd = (driverId) => addToTurnList(driverId);
  const handleRemove = (turnId) => removeFromTurnList(turnId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrativo — Despacho</h1>
          <p className="text-gray-500 text-sm">Sistema FIFO (First In, First Out)</p>
        </div>
        <button
          onClick={handleAssignNext}
          disabled={activeTurns.length === 0}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserCheck className="w-4 h-4" />
          Asignar Siguiente Viaje
        </button>
      </div>

      {/* Last assigned notification */}
      {lastAssigned && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Viaje asignado</p>
            <p className="text-sm text-green-700">{fullName(lastAssigned)} — {lastAssigned.numero_empleado}</p>
          </div>
          <button onClick={() => setLastAssigned(null)} className="ml-auto text-green-400 hover:text-green-600 text-xs">Cerrar</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{driversInQueue.size}</div>
          <div className="text-sm text-gray-500 mt-1">En Lista (Disponibles)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-gray-400">{unavailableCount}</div>
          <div className="text-sm text-gray-500 mt-1">No Disponibles</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-red-700">{turns.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total en Lista</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIFO Queue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-gray-900">Lista de Turnos (FIFO)</h2>
            <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeTurns.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activeTurns.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No hay choferes en lista
              </div>
            )}
            {activeTurns.map((turn, idx) => {
              const d = getDriver(turn.driver_id);
              if (!d) return null;
              return (
                <div key={turn.id} className="flex items-center gap-4 px-6 py-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{fullName(d)}</div>
                    <div className="text-xs text-gray-400">
                      {d.numero_empleado} • Agregado: {new Date(turn.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {idx === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Siguiente
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(turn.id)}
                    className="text-red-400 hover:text-red-600 text-xs ml-2"
                    title="Quitar de lista"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Assigned */}
          {assignedTurns.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Asignados</p>
              {assignedTurns.map((turn) => {
                const d = getDriver(turn.driver_id);
                if (!d) return null;
                return (
                  <div key={turn.id} className="flex items-center gap-3 py-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{fullName(d)}</span>
                    <span className="text-xs text-gray-400">{d.numero_empleado}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Drivers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-gray-900">Choferes Activos</h2>
            <span className="ml-auto text-xs text-gray-400">Click para agregar a la lista</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {activeDrivers.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">No hay choferes activos</div>
            )}
            {activeDrivers.map((d) => {
              const inQueue = driversInQueue.has(d.id);
              return (
                <div key={d.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs flex-shrink-0">
                    {d.nombre[0]}{d.apellido_paterno[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{fullName(d)}</div>
                    <div className="text-xs text-gray-400">{d.numero_empleado} • {d.telefono}</div>
                  </div>
                  {inQueue ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      En lista
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(d.id)}
                      className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
