import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Shell from '@/components/layout/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/store/authStore';

import Home from '@/pages/Home';
import Marketplace from '@/pages/Marketplace';
import ProductDetail from '@/pages/ProductDetail';
import Services from '@/pages/Services';
import ServiceDetail from '@/pages/ServiceDetail';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import Cart from '@/pages/Cart';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Wallet from '@/pages/Wallet';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => { bootstrap(); }, [bootstrap]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="marketplace/:slug" element={<ProductDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><Admin /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
