import { BrowserRouter as Router } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import { Link, Navigate } from 'react-router-dom';
import LoginOTP from './LoginOTP';
import Menu from './Menu';
import OrderTracker from './OrderTracker';
import KitchenDashboard from './KitchenDashboard';
import AdminDashboard from './AdminDashboard';
import AdminMenuManager from './AdminMenuManager';
import AdminRefunds from './AdminRefunds';
import AdminSupplierWaste from './AdminSupplierWaste';
import AdminOffersManager from './AdminOffersManager';
import AdminReviews from './AdminReviews';
import StudentProfile from './StudentProfile';
import UserActivity from './UserActivity';
import MultiCanteen from './MultiCanteen';
import UserLayout from './UserLayout';
import AdminLayout from './AdminLayout';
import WalletAndLoyalty from './WalletAndLoyalty';
import OffersAndCoupons from './OffersAndCoupons';
import SustainabilityDashboard from './SustainabilityDashboard';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import './index.css';

function App() {
  useEffect(() => {
    // Request notification permission and register SW
    if ('Notification' in window && navigator.serviceWorker) {
      Notification.requestPermission();
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('SW registration failed', err));
    }
  }, []);

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
          <Route path="activity" element={<UserActivity />} />
          <Route path="offers" element={<OffersAndCoupons />} />
          <Route path="wallet" element={<WalletAndLoyalty />} />
        </Route>
        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
          <Route path="menu" element={<AdminMenuManager />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="waste" element={<AdminSupplierWaste />} />
          <Route path="offers" element={<AdminOffersManager />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="sustainability" element={<SustainabilityDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
