import React, { useState } from "react";
import AdminMVP from "./AdminMVP";
import DriverApp from "./DriverApp";

export default function App() {
  const [stops, setStops] = useState([]);
  const [route, setRoute] = useState([]);
  const [view, setView] = useState("admin"); // "admin" or "driver"

  return (
    <div>
      <button onClick={() => setView("admin")}>Admin View</button>
      <button onClick={() => setView("driver")}>Driver View</button>

      {view === "admin" && <AdminMVP setStops={setStops} setRoute={setRoute} />}
      {view === "driver" && <DriverApp stops={stops} route={route} />}
    </div>
  );
}
