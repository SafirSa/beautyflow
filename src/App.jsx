import { Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import LandingPage from './pages/public/LandingPage.jsx';
import SalonBookingPage from './pages/public/SalonBookingPage.jsx';
import DashboardHome from './pages/dashboard/DashboardHome.jsx';
import BookingRequests from './pages/dashboard/BookingRequests.jsx';
import Clients from './pages/dashboard/Clients.jsx';
import Services from './pages/dashboard/Services.jsx';
import Messages from './pages/dashboard/Messages.jsx';
import Settings from './pages/dashboard/Settings.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/salon/:slug" element={<SalonBookingPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="bookings" element={<BookingRequests />} />
        <Route path="clients" element={<Clients />} />
        <Route path="services" element={<Services />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
