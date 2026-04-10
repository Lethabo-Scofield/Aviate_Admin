import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DriverLayout from "./components/DriverLayout";
import Dashboard from "./pages/Dashboard";
import DispatchCenter from "./pages/DispatchCenter";
import Jobs from "./pages/Jobs";
import MapView from "./pages/MapView";
import Drivers from "./pages/Drivers";
import MyJobs from "./pages/MyJobs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

function AdminRoutes() {
  return (
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dispatch" element={<DispatchCenter />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/drivers" element={<Drivers />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

function DriverRoutes() {
  return (
    <Route element={<DriverLayout />}>
      <Route path="/" element={<MyJobs />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const isDriver = user?.role === "driver";

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute>{isDriver ? <DriverLayout /> : <Layout />}</ProtectedRoute>}>
        {isDriver ? (
          <>
            <Route path="/" element={<MyJobs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dispatch" element={<DispatchCenter />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
