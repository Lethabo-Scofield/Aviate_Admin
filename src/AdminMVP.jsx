import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import DriverApp from "./DriverApp";

export default function AdminMVP() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processRows(results.data),
      });
    } else if (fileExt === "xlsx") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        processRows(jsonData);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file type. Please upload a CSV or Excel (.xlsx) file.");
      setLoading(false);
    }
  };

  async function processRows(rows) {
    try {
      // Accept both 'address' and 'Full_Address' columns
      const addresses = rows.map((row, idx) => ({
        id: idx + 1,
        address: row.address || row.Full_Address,
      }));

      const geocodedStops = [];
      const skippedAddresses = [];
      for (let stop of addresses) {
        if (!stop.address) {
          skippedAddresses.push(`Row ${stop.id}: missing address`);
          continue;
        }
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              stop.address + ", South Africa"
            )}`
          );
          const data = await res.json();
          console.log('Geocoding response for', stop.address, data); // Debug log
          if (!data || data.length === 0) {
            skippedAddresses.push(stop.address);
            continue;
          }
          geocodedStops.push({
            ...stop,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } catch (err) {
          skippedAddresses.push(stop.address);
        }
        // Add a delay to avoid rate limits (1 second)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setStops(geocodedStops);
      if (skippedAddresses.length > 0) {
        setError(`Skipped addresses (not geocoded):\n${skippedAddresses.join("\n")}`);
      } else {
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <span className="text-gray-600">Phase 1 MVP</span>
      </header>

      {/* CSV Upload */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Upload Delivery Stops</h2>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          className="px-3 py-2 border rounded w-full md:w-1/2"
        />
        {loading && <p className="text-blue-600 font-medium mt-2">Processing CSV...</p>}
        {error && <p className="text-red-600 font-medium mt-2">{error}</p>}
      </div>

      {/* Upcoming Features */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Upcoming Features</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Driver ETA and Distance Estimates</li>
          <li>Route Optimization for Multiple Drivers</li>
          <li>Export Route to Mobile App</li>
          <li>Fleet Management Dashboard</li>
        </ul>
      </div>

      {/* Driver App Map */}
      {stops.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Driver Route Preview</h2>
          <DriverApp stops={stops} />
        </div>
      )}
    </div>
  );
}
