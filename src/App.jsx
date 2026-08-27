import { BrowserRouter as Router } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LoginOTP from './LoginOTP';
import Menu from './Menu';
import OrderTracker from './OrderTracker';
import KitchenDashboard from './KitchenDashboard';
import AdminDashboard from './AdminDashboard';
import AdminMenuManager from './AdminMenuManager';
import AdminRefunds from './AdminRefunds';
import AdminSupplierWaste from './AdminSupplierWaste';
import StudentProfile from './StudentProfile';
import MultiCanteen from './MultiCanteen';
import UserLayout from './UserLayout';
import AdminLayout from './AdminLayout';
import WalletAndLoyalty from './WalletAndLoyalty';
import SustainabilityDashboard from './SustainabilityDashboard';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Default route redirect to login */}
        <Route path="/" element={<LoginOTP />} />
        <Route path="/login" element={<LoginOTP />} />
        {/* User Dashboard Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<MultiCanteen />} />
          <Route path="menu" element={<Menu />} />
          <Route path="tracker" element={<OrderTracker />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="wallet" element={<WalletAndLoyalty />} />
          <Route path="sustainability" element={<SustainabilityDashboard />} />
        </Route>
        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
          <Route path="menu" element={<AdminMenuManager />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="waste" element={<AdminSupplierWaste />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
