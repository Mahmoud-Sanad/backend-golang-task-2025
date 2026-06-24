const jwt = require('jsonwebtoken');

function generateAccessToken({ serverId, userId, role }, expiresInSec = 3600) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');

  const payload = { serverId, userId, role };
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: expiresInSec });
}

function verifyAccessToken(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  if (!token || typeof token !== 'string') throw new Error('Invalid token');

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return decoded;
  } catch (err) {
    throw new Error(err.message || 'Invalid token');
  }
}

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
