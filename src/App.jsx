import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import { supabase } from "./lib/supabaseClient.js";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import LandingPage from "./pages/public/LandingPage.jsx";
import SalonBookingPage from "./pages/public/SalonBookingPage.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import BookingRequests from "./pages/dashboard/BookingRequests.jsx";
import Clients from "./pages/dashboard/Clients.jsx";
import Services from "./pages/dashboard/Services.jsx";
import Messages from "./pages/dashboard/Messages.jsx";
import Settings from "./pages/dashboard/Settings.jsx";

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
      Loading...
    </div>
  );
}

function ProtectedRoute({ children, isCheckingAuth, session }) {
  if (isCheckingAuth) {
    return <AuthLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [session, setSession] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (supabase) {
      console.log("Supabase client connected");
      console.log(import.meta.env.VITE_SUPABASE_URL);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/salon/:slug" element={<SalonBookingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isCheckingAuth={isCheckingAuth} session={session}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
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
