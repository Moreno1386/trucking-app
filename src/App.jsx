import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import useFleetStore from './store/useFleetStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Dispatch from './pages/Dispatch';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Insurance from './pages/Insurance';
import CreditCards from './pages/CreditCards';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import { getTGConfig, sendTelegram, getLastSentDate, setLastSentDate, todayStr } from './utils/telegram';

function Protected({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLoader({ children }) {
  const fetchAll = useFleetStore((s) => s.fetchAll);
  const subscribeToRealtime = useFleetStore((s) => s.subscribeToRealtime);
  const getAlerts = useFleetStore((s) => s.getAlerts);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAll().then(() => {
      // Notificaciones automáticas: una vez por día
      const today = todayStr();
      if (getLastSentDate() === today) return;
      const { token, chatId } = getTGConfig();
      if (!token || !chatId) return;
      const alerts = getAlerts();
      if (alerts.length === 0) return;
      const lines = ['🚨 *Chaires Trucking — Alertas del día*', ''];
      alerts.forEach((a) => {
        const icon = a.severity === 'high' ? '🔴' : '🟡';
        lines.push(`${icon} *${a.titulo}*`);
        lines.push(`   ${a.mensaje}`);
        lines.push(`   ${a.detalle}`);
        lines.push('');
      });
      sendTelegram(token, chatId, lines.join('\n')).then((ok) => {
        if (ok) setLastSentDate(today);
      });
    });
    const unsubscribe = subscribeToRealtime();
    return unsubscribe;
  }, [isAuthenticated]);

  return children;
}

export default function App() {
  return (
    <HashRouter>
      <AppLoader>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="fleet" element={<Fleet />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="trips" element={<Trips />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="credit-cards" element={<CreditCards />} />
            <Route path="admin" element={<Admin />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLoader>
    </HashRouter>
  );
}
