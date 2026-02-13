from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock


@dataclass
class ObservabilitySnapshot:
    total_requests: int
    total_errors: int
    avg_latency_ms: float
    p95_latency_ms: float
    slow_requests: int
    routes: dict[str, int] = field(default_factory=dict)


class ObservabilityService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._latencies: list[float] = []
        self._total_requests = 0
        self._total_errors = 0
        self._slow_requests = 0
        self._route_counts: dict[str, int] = {}
        self._slow_queries: list[dict] = []

    def record(self, route_key: str, latency_ms: float, status_code: int, slow_threshold_ms: float = 700.0) -> None:
        with self._lock:
            self._total_requests += 1
            if status_code >= 500:
                self._total_errors += 1
            if latency_ms >= slow_threshold_ms:
                self._slow_requests += 1
            self._route_counts[route_key] = self._route_counts.get(route_key, 0) + 1

            self._latencies.append(latency_ms)
            if len(self._latencies) > 5000:
                self._latencies = self._latencies[-3000:]

    def record_slow_query(self, statement: str, duration_ms: float) -> None:
        with self._lock:
            self._slow_queries.append(
                {
                    "statement": statement[:500],
                    "duration_ms": round(duration_ms, 2),
                }
            )
            if len(self._slow_queries) > 100:
                self._slow_queries = self._slow_queries[-60:]

    def snapshot(self) -> ObservabilitySnapshot:
        with self._lock:
            if not self._latencies:
                return ObservabilitySnapshot(
                    total_requests=self._total_requests,
                    total_errors=self._total_errors,
                    avg_latency_ms=0.0,
                    p95_latency_ms=0.0,
                    slow_requests=self._slow_requests,
                    routes=dict(self._route_counts),
                )

            ordered = sorted(self._latencies)
            idx = int(0.95 * (len(ordered) - 1))
            p95 = ordered[idx]
            avg = sum(ordered) / len(ordered)
            return ObservabilitySnapshot(
                total_requests=self._total_requests,
                total_errors=self._total_errors,
                avg_latency_ms=round(avg, 2),
                p95_latency_ms=round(p95, 2),
                slow_requests=self._slow_requests,
                routes=dict(self._route_counts),
            )

    def slow_queries(self) -> list[dict]:
        with self._lock:
            return list(self._slow_queries)


observability_service = ObservabilityService()
