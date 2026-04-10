const API_BASE = '/api';

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function uploadExcel(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
  return handleResponse(res);
}

export async function optimizeStops(stops, numDrivers = 4, clusterRadius = 8) {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stops, num_drivers: numDrivers, cluster_radius: clusterRadius }),
  });
  return handleResponse(res);
}

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  return handleResponse(res);
}

export async function assignDriver(jobId, driverId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driver_id: driverId }),
  });
  return handleResponse(res);
}

export async function unassignDriver(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/unassign`, { method: 'POST' });
  return handleResponse(res);
}

export async function getDrivers() {
  const res = await fetch(`${API_BASE}/drivers`);
  return handleResponse(res);
}

export async function addDriver(name, phone, vehicleType) {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, vehicle_type: vehicleType }),
  });
  return handleResponse(res);
}

export async function removeDriver(driverId) {
  const res = await fetch(`${API_BASE}/drivers/${driverId}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function getDriverJobs(driverId) {
  const res = await fetch(`${API_BASE}/driver/${driverId}/jobs`);
  return handleResponse(res);
}

export async function completeStop(driverId, jobId, stopId) {
  const res = await fetch(`${API_BASE}/driver/${driverId}/complete/${jobId}/${stopId}`, { method: 'POST' });
  return handleResponse(res);
}

export async function loadTestData() {
  const res = await fetch(`${API_BASE}/test-data`, { method: 'POST' });
  return handleResponse(res);
}

export async function getStops() {
  const res = await fetch(`${API_BASE}/stops`);
  return handleResponse(res);
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return handleResponse(res);
}
