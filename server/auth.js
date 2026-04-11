import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

export function generateToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      user_id: user.id,
      company_id: user.company_id,
      email: user.email,
      role: user.role,
      driver_id: user.driver_id || null,
      iat: now,
      exp: now + 30 * 24 * 60 * 60,
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      user_id: payload.user_id,
      company_id: payload.company_id,
      email: payload.email || '',
      role: payload.role || 'admin',
      driver_id: payload.driver_id || null,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
