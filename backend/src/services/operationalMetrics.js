const WINDOW_MINUTES = 5;
const buckets = new Map();
let databaseDisconnects = 0;

function currentMinute(now = Date.now()) {
  return Math.floor(now / 60000);
}

function prune(nowMinute) {
  for (const minute of buckets.keys()) {
    if (minute < nowMinute - WINDOW_MINUTES + 1) buckets.delete(minute);
  }
}

function bucketFor(now = Date.now()) {
  const minute = currentMinute(now);
  prune(minute);
  if (!buckets.has(minute)) {
    buckets.set(minute, { requests: 0, clientErrors: 0, serverErrors: 0, authFailures: 0, databaseUnavailable: 0 });
  }
  return buckets.get(minute);
}

export function requestMetrics(req, res, next) {
  if (!req.path.endsWith('/health')) {
    res.once('finish', () => {
      const bucket = bucketFor();
      bucket.requests += 1;
      if (res.statusCode >= 400 && res.statusCode < 500) bucket.clientErrors += 1;
      if (res.statusCode >= 500) bucket.serverErrors += 1;
      if (res.statusCode === 401 || res.statusCode === 403) bucket.authFailures += 1;
      if (res.statusCode === 503 && mongooseUnavailableResponse(res)) bucket.databaseUnavailable += 1;
    });
  }
  next();
}

function mongooseUnavailableResponse(res) {
  return res.getHeader('x-tcm-database-unavailable') === '1';
}

export function markDatabaseDisconnect() {
  databaseDisconnects += 1;
}

export function getOperationalMetrics(now = Date.now()) {
  const minute = currentMinute(now);
  prune(minute);
  const summary = { requests: 0, clientErrors: 0, serverErrors: 0, authFailures: 0, databaseUnavailable: 0 };
  for (const bucket of buckets.values()) {
    for (const key of Object.keys(summary)) summary[key] += bucket[key];
  }
  return {
    windowMinutes: WINDOW_MINUTES,
    ...summary,
    serverErrorRate: summary.requests ? Number((summary.serverErrors / summary.requests).toFixed(4)) : 0,
    databaseDisconnects
  };
}

export function resetOperationalMetrics() {
  buckets.clear();
  databaseDisconnects = 0;
}
