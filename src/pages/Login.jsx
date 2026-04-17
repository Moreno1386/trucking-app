import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('admin@chairestrucking.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Ingresa tu contraseña'); return; }
    const ok = login(email, password);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('Credenciales incorrectas. Usa admin@chairestrucking.com');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-700 px-8 py-8 text-white text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-red-900 rounded-xl p-3">
                <Truck className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Chaires Trucking</h1>
            <p className="text-red-200 text-sm mt-1">Sistema de Gestión de Flota</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="admin@chairestrucking.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              Iniciar Sesión
            </button>

            <p className="text-center text-xs text-gray-400">
              Usa cualquier contraseña con el correo admin
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
