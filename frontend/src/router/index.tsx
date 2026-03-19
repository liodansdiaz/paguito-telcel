import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { Rol } from '../types';
import RouteErrorBoundary from '../components/RouteErrorBoundary';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';
import VendorLayout from '../components/layout/VendorLayout';

// Public pages
import Home from '../pages/public/Home';
import Catalog from '../pages/public/Catalog';
import ProductDetail from '../pages/public/ProductDetail';
import CartCheckout from '../pages/public/CartCheckout';
import ReservationSuccess from '../pages/public/ReservationSuccess';
import FAQ from '../pages/public/FAQ';
import Nosotros from '../pages/public/Nosotros';
import MiReserva from '../pages/public/MiReserva';

// Auth
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import ReservationsManager from '../pages/admin/ReservationsManager';
import CustomersDirectory from '../pages/admin/CustomersDirectory';
import CustomerProfile from '../pages/admin/CustomerProfile';
import VendorsManager from '../pages/admin/VendorsManager';
import InventoryManager from '../pages/admin/InventoryManager';

// Vendor
import VendorDashboard from '../pages/vendor/VendorDashboard';

// Guard component
const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: Rol }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.rol !== role) {
    return <Navigate to={user?.rol === 'ADMIN' ? '/admin/dashboard' : '/vendedor/dashboard'} replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Rutas públicas
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalogo', element: <Catalog /> },
      { path: '/producto/:id', element: <ProductDetail /> },
      { path: '/carrito', element: <CartCheckout /> },
      { path: '/reserva/exitosa', element: <ReservationSuccess /> },
      { path: '/faq', element: <FAQ /> },
      { path: '/nosotros', element: <Nosotros /> },
      { path: '/mi-reserva', element: <MiReserva /> },
    ],
  },
  // Auth
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  // Admin
  {
    path: '/admin',
    element: <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'reservas', element: <ReservationsManager /> },
      { path: 'clientes', element: <CustomersDirectory /> },
      { path: 'clientes/:id', element: <CustomerProfile /> },
      { path: 'vendedores', element: <VendorsManager /> },
      { path: 'inventario', element: <InventoryManager /> },
    ],
  },
  // Vendedor
  {
    path: '/vendedor',
    element: <ProtectedRoute role="VENDEDOR"><VendorLayout /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/vendedor/dashboard" replace /> },
      { path: 'dashboard', element: <VendorDashboard /> },
    ],
  },
  // 404
  { path: '*', element: <Navigate to="/" replace /> },
]);

export { ProtectedRoute };
