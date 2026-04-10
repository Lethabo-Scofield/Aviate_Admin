import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DispatchCenter from "./pages/DispatchCenter";
import LiveMap from "./pages/LiveMap";
import Jobs from "./pages/Jobs";
import Drivers from "./pages/Drivers";
import RoutesPage from "./pages/Routes";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dispatch" element={<DispatchCenter />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
