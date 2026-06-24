const prisma = require('../prisma').standard;
const { generateId } = require('../utils/idGenerator');

function shouldSkipLogging(req) {
  const url = req.originalUrl || req.url || '';
  // skip login/register and profile management
  if (url.includes('/accounts/login')) return true;
  if (url.includes('/accounts/register')) return true;
  if (url.includes('/accounts/me')) return true;
  return false;
}

function requestLogger(req, res, next) {
  if (shouldSkipLogging(req)) return next();

  const start = Date.now();
  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;
      const data = {
        id: generateId(process.env.SERVER_ID || 'srv'),
        level: 'INFO',
        message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
        meta: {
          path: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          durationMs: duration,
          userId: req.auth?.userId || null,
        }
      };
      // write log (ignore errors)
      await prisma.log.create({ data });
    } catch (err) {
      // ignore logging errors to not affect responses
      console.error('Logging failed', err);
    }
  });

  next();
}

module.exports = { requestLogger };
