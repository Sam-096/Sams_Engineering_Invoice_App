import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { CreateInvoice } from './pages/CreateInvoice';
import { CreateProforma } from './pages/CreateProforma';
import { CreateDeliveryChallan } from './pages/CreateDeliveryChallan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="invoice" element={<CreateInvoice />} />
            <Route path="proforma" element={<CreateProforma />} />
            <Route path="challan" element={<CreateDeliveryChallan />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
