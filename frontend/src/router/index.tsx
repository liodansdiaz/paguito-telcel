import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { Rol } from '../types';
import RouteErrorBoundary from '../components/RouteErrorBoundary';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';
import VendorLayout from '../components/layout/VendorLayout';

// Public pages - ACXOCEL Corporate
import Home from '../pages/public/Home';
import Nosotros from '../pages/public/Nosotros';

// Public pages - Amigo Paguitos
import AmigoPaguitosHome from '../pages/public/amigo-paguitos/Home';
import Catalog from '../pages/public/amigo-paguitos/Catalog';
import ProductDetail from '../pages/public/amigo-paguitos/ProductDetail';
import CartCheckout from '../pages/public/amigo-paguitos/CartCheckout';
import ReservationSuccess from '../pages/public/amigo-paguitos/ReservationSuccess';
import FAQ from '../pages/public/amigo-paguitos/FAQ';
import DondePagar from '../pages/public/amigo-paguitos/DondePagar';
import MiReserva from '../pages/public/amigo-paguitos/MiReserva';

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
import AdminsManager from '../pages/admin/AdminsManager';
import InventoryManager from '../pages/admin/InventoryManager';
import SystemDashboard from '../pages/admin/SystemDashboard';
import Configuracion from '../pages/admin/Configuracion';
import ChatConfigManager from '../pages/admin/ChatConfigManager';
import AssignmentConfig from '../pages/admin/AssignmentConfig';

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
  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS CORPORATIVAS ACXOCEL
  // ══════════════════════════════════════════════════════════════════════════
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/nosotros', element: <Nosotros /> },
      // TODO: Agregar rutas de planes, equipos, corporativo, sucursales, trabaja
    ],
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS AMIGO PAGUITOS (bajo /amigo-paguitos/*)
  // ══════════════════════════════════════════════════════════════════════════
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Redirect /amigo-paguitos → /amigo-paguitos/catalogo
      { path: '/amigo-paguitos', element: <Navigate to="/amigo-paguitos/catalogo" replace /> },
      
      // Páginas de Amigo Paguitos
      { path: '/amigo-paguitos/home', element: <AmigoPaguitosHome /> },
      { path: '/amigo-paguitos/catalogo', element: <Catalog /> },
      { path: '/amigo-paguitos/producto/:id', element: <ProductDetail /> },
      { path: '/amigo-paguitos/carrito', element: <CartCheckout /> },
      { path: '/amigo-paguitos/reserva/exitosa', element: <ReservationSuccess /> },
      { path: '/amigo-paguitos/faq', element: <FAQ /> },
      { path: '/amigo-paguitos/donde-pagar', element: <DondePagar /> },
      { path: '/amigo-paguitos/mi-reserva', element: <MiReserva /> },
    ],
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // REDIRECTS LEGACY (para no romper links externos)
  // ══════════════════════════════════════════════════════════════════════════
  { path: '/catalogo', element: <Navigate to="/amigo-paguitos/catalogo" replace /> },
  { path: '/producto/:id', element: <Navigate to="/amigo-paguitos/producto/:id" replace /> },
  { path: '/carrito', element: <Navigate to="/amigo-paguitos/carrito" replace /> },
  { path: '/reserva/exitosa', element: <Navigate to="/amigo-paguitos/reserva/exitosa" replace /> },
  { path: '/faq', element: <Navigate to="/amigo-paguitos/faq" replace /> },
  { path: '/donde-pagar', element: <Navigate to="/amigo-paguitos/donde-pagar" replace /> },
  { path: '/mi-reserva', element: <Navigate to="/amigo-paguitos/mi-reserva" replace /> },
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
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'reservas', element: <ReservationsManager /> },
      { path: 'clientes', element: <CustomersDirectory /> },
      { path: 'clientes/:id', element: <CustomerProfile /> },
      { path: 'vendedores', element: <VendorsManager /> },
      { path: 'administradores', element: <AdminsManager /> },
      { path: 'inventario', element: <InventoryManager /> },
      { path: 'sistema', element: <SystemDashboard /> },
      { path: 'configuracion', element: <Configuracion /> },
      { path: 'configuracion/asignacion', element: <AssignmentConfig /> },
      { path: 'chat-config', element: <ChatConfigManager /> },
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
