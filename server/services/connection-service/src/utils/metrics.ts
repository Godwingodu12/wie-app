import { Request, Response, NextFunction } from 'express';
import prometheus from 'prom-client';
import logger from './logger';

// Create a Registry
export const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestCounter = new prometheus.Counter({
  name: 'connection_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new prometheus.Histogram({
  name: 'connection_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const matchingAlgorithmDuration = new prometheus.Histogram({
  name: 'matching_algorithm_duration_seconds',
  help: 'Duration of matching algorithm execution',
  labelNames: ['purpose_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const connectionRequestsCounter = new prometheus.Counter({
  name: 'connection_requests_total',
  help: 'Total number of connection requests',
  labelNames: ['status', 'purpose_code'],
  registers: [register],
});

export const activeConnectionsGauge = new prometheus.Gauge({
  name: 'active_connections_total',
  help: 'Total number of active connections',
  registers: [register],
});

export const cacheHitCounter = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

export const cacheMissCounter = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

export const profileCompletionGauge = new prometheus.Histogram({
  name: 'profile_completion_percentage',
  help: 'Distribution of profile completion percentages',
  buckets: [0, 20, 40, 60, 80, 100],
  registers: [register],
});
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    httpRequestCounter.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
  });
  next();
};


// Metrics endpoint handler
export const metricsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
};

// Helper function to record matching algorithm duration
export const recordMatchingDuration = (purposeCode: string, durationMs: number): void => {
  matchingAlgorithmDuration.observe({ purpose_code: purposeCode }, durationMs / 1000);
};

// Helper function to record connection request
export const recordConnectionRequest = (status: string, purposeCode: string): void => {
  connectionRequestsCounter.inc({ status, purpose_code: purposeCode });
};

// Helper function to record cache hit/miss
export const recordCacheHit = (keyPrefix: string): void => {
  cacheHitCounter.inc({ cache_key_prefix: keyPrefix });
};

export const recordCacheMiss = (keyPrefix: string): void => {
  cacheMissCounter.inc({ cache_key_prefix: keyPrefix });
};