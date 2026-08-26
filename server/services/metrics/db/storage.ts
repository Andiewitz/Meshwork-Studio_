import { pool } from "./connection";

export interface MetricCounts {
  total_users?: number;
  new_users_today?: number;
  active_users_24h?: number;
  logins_today?: number;
  total_workspaces?: number;
  total_teams?: number;
}

// Cross-service counters arrive over the internal API — users live in
// auth_db, workspaces in workspace_db, teams in team_db. A service that
// fails to answer contributes zeros rather than breaking collection.
async function fetchCount<T>(service: string, path: string): Promise<T | null> {
  const key = process.env.INTERNAL_API_KEY || "";
  const base =
    process.env[`${service.toUpperCase()}_SERVICE_URL`] ||
    "http://127.0.0.1:5000";
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${base}${path}`, {
      headers: { "X-Internal-Key": key },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface AuthUserStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers24h: number;
  loginsToday: number;
}

export async function queryMetricsCounts(): Promise<MetricCounts> {
  const [auth, workspace, team] = await Promise.all([
    fetchCount<AuthUserStats>("auth", "/internal/stats/users"),
    fetchCount<{ totalWorkspaces: number }>("workspace", "/internal/stats"),
    fetchCount<{ totalTeams: number }>("team", "/internal/stats"),
  ]);

  return {
    total_users: auth?.totalUsers ?? 0,
    new_users_today: auth?.newUsersToday ?? 0,
    active_users_24h: auth?.activeUsers24h ?? 0,
    logins_today: auth?.loginsToday ?? 0,
    total_workspaces: workspace?.totalWorkspaces ?? 0,
    total_teams: team?.totalTeams ?? 0,
  };
}

export async function insertSnapshot(values: {
  totalRequests: number;
  requestRate: number;
  avgDurationMs: number;
  memoryMb: number;
  cpuSeconds: number;
  eventLoopLagMs: number;
  wsConnections: number;
  wsRooms: number;
  aiRequests: number;
  totalUsers: number;
  newUsersToday: number;
  activeUsers24h: number;
  loginsToday: number;
  totalWorkspaces: number;
  totalTeams: number;
}) {
  await pool.query(
    `INSERT INTO metrics_snapshots
      (captured_at, total_requests, request_rate, avg_duration_ms, memory_mb, cpu_seconds, event_loop_lag_ms, ws_connections, ws_rooms, ai_requests, total_users, new_users_today, active_users_24h, logins_today, total_workspaces, total_teams)
     VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      values.totalRequests,
      values.requestRate,
      Math.round(values.avgDurationMs * 100) / 100,
      Math.round(values.memoryMb * 10) / 10,
      Math.round(values.cpuSeconds * 100) / 100,
      Math.round(values.eventLoopLagMs * 10) / 10,
      values.wsConnections,
      values.wsRooms,
      values.aiRequests,
      values.totalUsers,
      values.newUsersToday,
      values.activeUsers24h,
      values.loginsToday,
      values.totalWorkspaces,
      values.totalTeams,
    ],
  );
}

export async function getMetricsHistory(limit: number) {
  const result = await pool.query(
    `SELECT
       captured_at as "capturedAt",
       total_requests as "totalRequests",
       request_rate as "requestRate",
       avg_duration_ms as "avgDurationMs",
       memory_mb as "memoryMb",
       cpu_seconds as "cpuSeconds",
       event_loop_lag_ms as "eventLoopLagMs",
       ws_connections as "wsConnections",
       ws_rooms as "wsRooms",
       ai_requests as "aiRequests",
       total_users as "totalUsers",
       new_users_today as "newUsersToday",
       active_users_24h as "activeUsers24h",
       logins_today as "loginsToday",
       total_workspaces as "totalWorkspaces",
       total_teams as "totalTeams"
     FROM metrics_snapshots
     ORDER BY captured_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.reverse();
}

export async function getMetricsSummary() {
  const result = await pool.query(`
    SELECT
      (SELECT total_requests FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "totalRequests",
      (SELECT SUM(request_rate) FROM metrics_snapshots WHERE captured_at > NOW() - INTERVAL '1 hour') as "requestsLastHour",
      (SELECT AVG(avg_duration_ms) FROM metrics_snapshots WHERE captured_at > NOW() - INTERVAL '1 hour') as "avgDurationLastHour",
      (SELECT AVG(memory_mb) FROM metrics_snapshots WHERE captured_at > NOW() - INTERVAL '1 hour') as "avgMemoryLastHour",
      (SELECT MAX(event_loop_lag_ms) FROM metrics_snapshots WHERE captured_at > NOW() - INTERVAL '1 hour') as "maxLagLastHour",
      (SELECT SUM(ai_requests) FROM metrics_snapshots WHERE captured_at > NOW() - INTERVAL '1 hour') as "aiRequestsLastHour",
      (SELECT COUNT(*) FROM metrics_snapshots) as "totalSnapshots",
      (SELECT MIN(captured_at) FROM metrics_snapshots) as "firstSnapshot",
      (SELECT MAX(captured_at) FROM metrics_snapshots) as "lastSnapshot",
      (SELECT total_users FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "totalUsers",
      (SELECT new_users_today FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "newUsersToday",
      (SELECT active_users_24h FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "activeUsers24h",
      (SELECT logins_today FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "loginsToday",
      (SELECT total_workspaces FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "totalWorkspaces",
      (SELECT total_teams FROM metrics_snapshots ORDER BY captured_at DESC LIMIT 1) as "totalTeams"
  `);
  return result.rows[0];
}

export async function cleanupOldSnapshots(days = 7) {
  const result = await pool.query(
    `DELETE FROM metrics_snapshots WHERE captured_at < NOW() - INTERVAL '${days} days'`,
  );
  return result.rowCount ?? 0;
}
