export type ConnectionStatus = "connected" | "error";
export type OverallStatus = "healthy" | "degraded" | "unhealthy";

export interface SubsystemHealth {
  status: ConnectionStatus;
  latency_ms: number;
  error?: string;
}

export type QueueStatus = "running" | "stopped";

export interface QueueHealth {
  status: QueueStatus;
  pending_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface GeminiHealth {
  circuit_breaker: CircuitState;
  failures: number;
  last_failure: string | null;
}

export interface MemoryUsageMb {
  used_mb: number;
  rss_mb: number;
  heap_mb: number;
}

export interface HealthPayload {
  status: OverallStatus;
  timestamp: string;
  database: SubsystemHealth;
  redis: SubsystemHealth;
  queue: QueueHealth;
  gemini: GeminiHealth;
  memory: MemoryUsageMb;
  uptime_seconds: number;
  requestId?: string;
  hostname: string;
}
