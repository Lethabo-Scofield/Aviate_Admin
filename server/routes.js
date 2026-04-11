import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { generateToken, requireAuth, requireAdmin } from './auth.js';

const router = Router();

function userToDict(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    company_id: row.company_id,
    company_name: row.company_name || null,
    driver_id: row.driver_id || null,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  };
}

function driverToDict(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    vehicle_type: row.vehicle_type || 'van',
    status: row.status || 'available',
    has_account: !!row.user_id,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  };
}

function stopToDict(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    customer_name: row.customer_name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    demand: row.demand,
    service_time: row.service_time,
    phone: row.phone || '',
    notes: row.notes || '',
    time_window_start: row.time_window_start || '',
    time_window_end: row.time_window_end || '',
    job_id: row.job_id,
    stop_number: row.stop_number,
    completed: row.completed,
    completed_at: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

function jobToDict(row, stops = []) {
  return {
    id: row.id,
    area: row.area,
    stops: stops.map(stopToDict),
    total_stops: row.total_stops,
    total_distance_km: row.total_distance_km,
    estimated_time_min: row.estimated_time_min,
    estimated_cost: row.estimated_cost,
    center_lat: row.center_lat,
    center_lng: row.center_lng,
    status: row.status,
    driver_id: row.driver_id,
    driver_name: row.driver_name,
    route_geometry: row.route_geometry,
    assigned_at: row.assigned_at ? row.assigned_at.toISOString() : null,
    completed_at: row.completed_at ? row.completed_at.toISOString() : null,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  };
}

async function getJobsWithStops(client, companyId, extraFilter = '', params = []) {
  const jobQuery = `SELECT * FROM jobs WHERE company_id = $1 ${extraFilter} ORDER BY created_at DESC`;
  const jobResult = await client.query(jobQuery, [companyId, ...params]);
  const jobs = jobResult.rows;
  if (jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const stopResult = await client.query(
    `SELECT * FROM stops WHERE job_id = ANY($1) ORDER BY stop_number`,
    [jobIds]
  );
  const stopsByJob = {};
  for (const s of stopResult.rows) {
    if (!stopsByJob[s.job_id]) stopsByJob[s.job_id] = [];
    stopsByJob[s.job_id].push(s);
  }
  return jobs.map((j) => jobToDict(j, stopsByJob[j.id] || []));
}

router.post('/auth/register', async (req, res) => {
  const { email: rawEmail, password, name, company_name } = req.body || {};
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email || !password || !name || !company_name) {
    return res.status(400).json({ error: 'All fields are required: name, email, password, company_name' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const domain = email.includes('@') ? email.split('@')[1] : '';
    const companyId = `CMP-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const userId = `USR-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    await client.query(
      'INSERT INTO companies (id, name, domain, created_at) VALUES ($1, $2, $3, NOW())',
      [companyId, company_name.trim(), domain]
    );
    await client.query(
      'INSERT INTO users (id, email, password_hash, name, role, company_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [userId, email, passwordHash, name.trim(), 'admin', companyId]
    );
    await client.query('COMMIT');

    const userResult = await client.query(
      'SELECT u.*, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    const token = generateToken(user);

    return res.status(201).json({ success: true, token, user: userToDict(user) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

router.post('/auth/login', async (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT u.*, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({ success: true, token, user: userToDict(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  } finally {
    client.release();
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT u.*, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.id = $1',
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: userToDict(result.rows[0]) });
  } finally {
    client.release();
  }
});

router.get('/jobs', requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const jobs = await getJobsWithStops(client, req.user.company_id);
    return res.json({ jobs });
  } finally {
    client.release();
  }
});

router.post('/jobs/:jobId/assign', requireAuth, requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  const { driver_id } = req.body || {};

  if (!driver_id) {
    return res.status(400).json({ error: 'driver_id is required' });
  }

  const client = await pool.connect();
  try {
    const driverResult = await client.query(
      'SELECT * FROM drivers WHERE id = $1 AND company_id = $2',
      [driver_id, req.user.company_id]
    );
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await client.query(
      `UPDATE jobs SET status = 'assigned', driver_id = $1, driver_name = $2, assigned_at = NOW() WHERE id = $3`,
      [driver_id, driverResult.rows[0].name, jobId]
    );

    const updated = await getJobsWithStops(client, req.user.company_id, 'AND id = $2', [jobId]);
    return res.json({ success: true, job: updated[0] });
  } catch (err) {
    console.error('Assign error:', err);
    return res.status(500).json({ error: 'Failed to assign driver' });
  } finally {
    client.release();
  }
});

router.post('/jobs/:jobId/unassign', requireAuth, requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  const client = await pool.connect();
  try {
    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await client.query(
      `UPDATE jobs SET status = 'unassigned', driver_id = NULL, driver_name = NULL, assigned_at = NULL WHERE id = $1`,
      [jobId]
    );

    const updated = await getJobsWithStops(client, req.user.company_id, 'AND id = $2', [jobId]);
    return res.json({ success: true, job: updated[0] });
  } catch (err) {
    console.error('Unassign error:', err);
    return res.status(500).json({ error: 'Failed to unassign driver' });
  } finally {
    client.release();
  }
});

router.get('/drivers', requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM drivers WHERE company_id = $1 ORDER BY created_at DESC',
      [req.user.company_id]
    );
    return res.json({ drivers: result.rows.map(driverToDict) });
  } finally {
    client.release();
  }
});

router.post('/drivers', requireAuth, requireAdmin, async (req, res) => {
  const { name, email: rawEmail, vehicle_type, password: rawPassword } = req.body || {};
  const email = (rawEmail || '').trim().toLowerCase();

  if (!name) return res.status(400).json({ error: 'Driver name is required' });
  if (!email) return res.status(400).json({ error: 'Driver email is required for app login' });

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `A user with email ${email} already exists` });
    }

    const driverId = `DRV-${uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    const userId = `USR-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const password = rawPassword || uuidv4().replace(/-/g, '').slice(0, 8);
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    await client.query(
      'INSERT INTO drivers (id, name, email, vehicle_type, company_id, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [driverId, name, email, vehicle_type || 'van', req.user.company_id, userId]
    );
    await client.query(
      'INSERT INTO users (id, email, password_hash, name, role, company_id, driver_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [userId, email, passwordHash, name, 'driver', req.user.company_id, driverId]
    );
    await client.query('COMMIT');

    const driverResult = await client.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    const result = driverToDict(driverResult.rows[0]);
    result.generated_password = password;

    return res.status(201).json({ success: true, driver: result });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Add driver error:', err);
    return res.status(500).json({ error: 'Failed to add driver' });
  } finally {
    client.release();
  }
});

router.delete('/drivers/:driverId', requireAuth, requireAdmin, async (req, res) => {
  const { driverId } = req.params;
  const client = await pool.connect();
  try {
    const driverResult = await client.query(
      'SELECT * FROM drivers WHERE id = $1 AND company_id = $2',
      [driverId, req.user.company_id]
    );
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await client.query('BEGIN');
    await client.query(
      `UPDATE jobs SET status = 'unassigned', driver_id = NULL, driver_name = NULL WHERE driver_id = $1 AND company_id = $2`,
      [driverId, req.user.company_id]
    );

    const driver = driverResult.rows[0];
    if (driver.user_id) {
      await client.query('DELETE FROM users WHERE id = $1', [driver.user_id]);
    }
    await client.query('DELETE FROM drivers WHERE id = $1', [driverId]);
    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Remove driver error:', err);
    return res.status(500).json({ error: 'Failed to remove driver' });
  } finally {
    client.release();
  }
});

router.get('/my-jobs', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    let driverResult = await client.query(
      'SELECT * FROM drivers WHERE user_id = $1 AND company_id = $2',
      [req.user.user_id, req.user.company_id]
    );
    if (driverResult.rows.length === 0) {
      driverResult = await client.query(
        'SELECT * FROM drivers WHERE email = $1 AND company_id = $2',
        [req.user.email, req.user.company_id]
      );
    }
    if (driverResult.rows.length === 0) {
      return res.json({ driver: null, jobs: [] });
    }

    const driver = driverResult.rows[0];
    const jobs = await getJobsWithStops(client, req.user.company_id, 'AND driver_id = $2', [driver.id]);
    return res.json({ driver: driverToDict(driver), jobs });
  } finally {
    client.release();
  }
});

router.post('/my-jobs/:jobId/complete/:stopId', requireAuth, async (req, res) => {
  const { jobId, stopId } = req.params;
  const client = await pool.connect();
  try {
    let driverResult = await client.query(
      'SELECT * FROM drivers WHERE user_id = $1 AND company_id = $2',
      [req.user.user_id, req.user.company_id]
    );
    if (driverResult.rows.length === 0) {
      driverResult = await client.query(
        'SELECT * FROM drivers WHERE email = $1 AND company_id = $2',
        [req.user.email, req.user.company_id]
      );
    }
    if (driverResult.rows.length === 0) {
      return res.status(403).json({ error: 'No driver profile linked to your account' });
    }

    const driver = driverResult.rows[0];
    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1 AND driver_id = $2 AND company_id = $3',
      [jobId, driver.id, req.user.company_id]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }

    const stopResult = await client.query(
      'SELECT * FROM stops WHERE id = $1 AND job_id = $2',
      [stopId, jobId]
    );
    if (stopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    await client.query(
      'UPDATE stops SET completed = true, completed_at = NOW() WHERE id = $1',
      [stopId]
    );

    const allStops = await client.query('SELECT completed FROM stops WHERE job_id = $1', [jobId]);
    const allCompleted = allStops.rows.every((s) => s.completed || s.id === stopId);

    let jobStatus = jobResult.rows[0].status;
    if (allCompleted) {
      await client.query(
        `UPDATE jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [jobId]
      );
      jobStatus = 'completed';
    }

    const updatedStop = await client.query('SELECT * FROM stops WHERE id = $1', [stopId]);
    return res.json({ success: true, stop: stopToDict(updatedStop.rows[0]), job_status: jobStatus });
  } catch (err) {
    console.error('Complete stop error:', err);
    return res.status(500).json({ error: 'Failed to complete stop' });
  } finally {
    client.release();
  }
});

router.get('/driver/:driverId/jobs', requireAuth, requireAdmin, async (req, res) => {
  const { driverId } = req.params;
  const client = await pool.connect();
  try {
    const driverResult = await client.query(
      'SELECT * FROM drivers WHERE id = $1 AND company_id = $2',
      [driverId, req.user.company_id]
    );
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    const jobs = await getJobsWithStops(client, req.user.company_id, 'AND driver_id = $2', [driverId]);
    return res.json({ driver_id: driverId, jobs });
  } finally {
    client.release();
  }
});

router.post('/driver/:driverId/complete/:jobId/:stopId', requireAuth, requireAdmin, async (req, res) => {
  const { driverId, jobId, stopId } = req.params;
  const client = await pool.connect();
  try {
    const jobResult = await client.query(
      'SELECT * FROM jobs WHERE id = $1 AND driver_id = $2 AND company_id = $3',
      [jobId, driverId, req.user.company_id]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const stopResult = await client.query(
      'SELECT * FROM stops WHERE id = $1 AND job_id = $2',
      [stopId, jobId]
    );
    if (stopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    await client.query(
      'UPDATE stops SET completed = true, completed_at = NOW() WHERE id = $1',
      [stopId]
    );

    const allStops = await client.query('SELECT completed FROM stops WHERE job_id = $1', [jobId]);
    const allCompleted = allStops.rows.every((s) => s.completed || s.id === stopId);

    let jobStatus = jobResult.rows[0].status;
    if (allCompleted) {
      await client.query(`UPDATE jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`, [jobId]);
      jobStatus = 'completed';
    }

    const updatedStop = await client.query('SELECT * FROM stops WHERE id = $1', [stopId]);
    return res.json({ success: true, stop: stopToDict(updatedStop.rows[0]), job_status: jobStatus });
  } catch (err) {
    console.error('Complete stop error:', err);
    return res.status(500).json({ error: 'Failed to complete stop' });
  } finally {
    client.release();
  }
});

router.get('/stops', requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM stops WHERE company_id = $1 ORDER BY stop_number',
      [req.user.company_id]
    );
    return res.json({ stops: result.rows.map(stopToDict) });
  } finally {
    client.release();
  }
});

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const jobResult = await client.query('SELECT * FROM jobs WHERE company_id = $1', [req.user.company_id]);
    const driverResult = await client.query('SELECT id FROM drivers WHERE company_id = $1', [req.user.company_id]);

    const jobs = jobResult.rows;
    const totalJobs = jobs.length;
    const unassigned = jobs.filter((j) => j.status === 'unassigned').length;
    const assigned = jobs.filter((j) => j.status === 'assigned').length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const totalStops = jobs.reduce((sum, j) => sum + (j.total_stops || 0), 0);
    const totalDistance = jobs.reduce((sum, j) => sum + (j.total_distance_km || 0), 0);
    const totalCost = jobs.reduce((sum, j) => sum + (j.estimated_cost || 0), 0);

    return res.json({
      total_jobs: totalJobs,
      unassigned,
      assigned,
      completed,
      total_stops: totalStops,
      total_distance_km: Math.round(totalDistance * 10) / 10,
      total_estimated_cost: Math.round(totalCost * 100) / 100,
      total_drivers: driverResult.rows.length,
    });
  } finally {
    client.release();
  }
});

router.post('/route', requireAuth, requireAdmin, async (req, res) => {
  const { waypoints } = req.body || {};
  if (!waypoints || waypoints.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 waypoints' });
  }
  const coords = waypoints.map((p) => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.length) {
      return res.json({
        success: true,
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance || 0,
        duration: data.routes[0].duration || 0,
      });
    }
    return res.status(404).json({ success: false, error: 'No route found' });
  } catch (err) {
    console.error('Route fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch route' });
  }
});

export default router;
