// Simple in-memory cache implementation
const cache = new Map();

export const cacheMiddleware = (keyPrefix, duration = 3600) => {
  return async (req, res, next) => {
    try {
      const cacheKey = `${keyPrefix}:${req.originalUrl}`;
      const now = Date.now();
      
      // Check if cache exists and is still valid
      const cached = cache.get(cacheKey);
      if (cached && now < cached.expiry) {
        return res.json(cached.data);
      }

      // Store original res.json to intercept the response
      const originalJson = res.json;
      res.json = function(data) {
        cache.set(cacheKey, {
          data,
          expiry: now + (duration * 1000)
        });
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

export const invalidateCache = async (pattern) => {
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};