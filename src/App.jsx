import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DispatchCenter from "./pages/DispatchCenter";
import Jobs from "./pages/Jobs";
import MapView from "./pages/MapView";
import Drivers from "./pages/Drivers";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dispatch" element={<DispatchCenter />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
