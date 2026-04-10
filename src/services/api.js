const API_BASE = '/api';

function getAuthHeaders(contentType) {
  const headers = {};
  const token = localStorage.getItem("aviate_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }
  if (res.status === 401) {
    localStorage.removeItem("aviate_token");
    localStorage.removeItem("aviate_user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function uploadExcel(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  });
  return handleResponse(res);
}

export async function optimizeStops(stops, numDrivers = 4, clusterRadius = 8) {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({ stops, num_drivers: numDrivers, cluster_radius: clusterRadius }),
  });
  return handleResponse(res);
}

export async function getJobs() {
  const res = await fetch(`${API_BASE}/jobs`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function assignDriver(jobId, driverId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/assign`, {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({ driver_id: driverId }),
  });
  return handleResponse(res);
}

export async function unassignDriver(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/unassign`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getDrivers() {
  const res = await fetch(`${API_BASE}/drivers`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function addDriver(name, email, vehicleType) {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: getAuthHeaders('application/json'),
    body: JSON.stringify({ name, email, vehicle_type: vehicleType }),
  });
  return handleResponse(res);
}

export async function removeDriver(driverId) {
  const res = await fetch(`${API_BASE}/drivers/${driverId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
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
  const res = await fetch(`${API_BASE}/test-data`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getStops() {
  const res = await fetch(`${API_BASE}/stops`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/stats`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
