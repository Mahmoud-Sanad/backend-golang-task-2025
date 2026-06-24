const { verifyAccessToken } = require('../utils/tokenService');

function isLoggedIn(req, res, next) {
  const auth = req.headers && req.headers.authorization;
  console.log(req.headers);
  
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Missing Authorization header' });
  }

  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, error: 'Invalid Authorization format' });
  }

  const token = match[1];
  try {
    const payload = verifyAccessToken(token);
    console.log("payload : " ,payload);
    
    // attach useful fields
    req.auth = {
      serverId: payload.serverId,
      userId: payload.userId,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp
    };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
}
function canAccess(...allowedRoles){
    return (req, res, next) => {
        if (!req.auth || !req.auth.role || !allowedRoles.includes(req.auth.role)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        return next();
    };
}

module.exports = { isLoggedIn, canAccess };