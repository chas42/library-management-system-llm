// Simple in-memory rate limiter
const requests = new Map();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requests.entries()) {
    if (now > data.resetTime) {
      requests.delete(key);
    }
  }
}, 60000); // Cleanup every minute

// Prevent memory leak if the server is stopped
process.on('SIGTERM', () => clearInterval(cleanupInterval));
process.on('SIGINT', () => clearInterval(cleanupInterval));

const createLimiter = (windowMs, max, errorMessage) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    let requestData = requests.get(key);
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    requestData.count++;
    requests.set(key, requestData);

    if (requestData.count > max) {
      return res.status(429).json({ error: errorMessage });
    }

    next();
  };
};

// General API rate limiter: 100 requests per minute
export const apiLimiter = createLimiter(
  60 * 1000, // 1 minute
  100,
  'Too many requests, please try again later.'
);

// More lenient rate limiter for authentication endpoints: 20 attempts per 15 minutes
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  20, // Increased from 5 to 20 attempts
  'Too many login attempts, please try again later.'
);