import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
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

function Protected({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <HashRouter>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
