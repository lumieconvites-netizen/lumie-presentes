#!/usr/bin/env node

const BASE_URL = (process.env.LOAD_BASE_URL || "https://lumieeventos.com").replace(/\/+$/, "");
const DURATION_SECONDS = Number.parseInt(process.env.LOAD_DURATION_SECONDS || "120", 10);
const CONCURRENCY = Number.parseInt(process.env.LOAD_CONCURRENCY || "20", 10);
const TIMEOUT_MS = Number.parseInt(process.env.LOAD_TIMEOUT_MS || "10000", 10);
const FAIL_RATE_THRESHOLD = Number.parseFloat(process.env.LOAD_FAIL_RATE_THRESHOLD || "0.05");
const RSVP_SLUG = (process.env.LOAD_RSVP_SLUG || "").trim();
const RSVP_QUERY = (process.env.LOAD_RSVP_QUERY || "ma").trim();
const ENABLE_WRITE_SCENARIOS = (process.env.LOAD_ENABLE_WRITE_SCENARIOS || "0") === "1";

const nowIso = () => new Date().toISOString();

function randomId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function pickWeighted(operations) {
  const total = operations.reduce((sum, op) => sum + op.weight, 0);
  let roll = Math.random() * total;
  for (const op of operations) {
    if (roll < op.weight) return op;
    roll -= op.weight;
  }
  return operations[operations.length - 1];
}

function toQuery(params) {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    u.set(key, String(value));
  }
  const q = u.toString();
  return q ? `?${q}` : "";
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function getOperations() {
  const ops = [
    {
      name: "browse_home",
      weight: 35,
      buildRequest: () => ({ method: "GET", path: "/" }),
      isExpectedStatus: (status) => status === 200,
    },
    {
      name: "browse_site",
      weight: 20,
      buildRequest: () => ({ method: "GET", path: "/site" }),
      isExpectedStatus: (status) => status === 200,
    },
    {
      name: "browse_templates",
      weight: 20,
      buildRequest: () => ({ method: "GET", path: "/templates" }),
      isExpectedStatus: (status) => status === 200,
    },
    {
      name: "upload_guard",
      weight: 10,
      buildRequest: () => ({ method: "POST", path: "/api/upload/avatar" }),
      isExpectedStatus: (status) => status === 401,
    },
  ];

  if (RSVP_SLUG) {
    ops.push({
      name: "rsvp_search",
      weight: 15,
      buildRequest: () => ({
        method: "GET",
        path: `/api/public/rsvp/${encodeURIComponent(RSVP_SLUG)}/search${toQuery({ q: RSVP_QUERY })}`,
      }),
      isExpectedStatus: (status) => status === 200 || status === 429,
    });
  }

  if (ENABLE_WRITE_SCENARIOS) {
    ops.push(
      {
        name: "register_validate",
        weight: 5,
        buildRequest: () => ({
          method: "POST",
          path: "/api/auth/register",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Load Test User",
            email: "invalid-email",
            password: "123456",
          }),
        }),
        isExpectedStatus: (status) => status === 400 || status === 429,
      },
      {
        name: "checkout_validate",
        weight: 5,
        buildRequest: () => ({
          method: "POST",
          path: "/api/orders",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            giftId: "loadtest-gift",
            giftListId: "loadtest-list",
            guestName: "Load Test",
            guestEmail: `loadtest+${randomId()}@example.com`,
            guestDocument: "00000000000",
            guestPhoneArea: "11",
            guestPhoneNumber: "988887777",
            paymentMethod: "PIX",
            quantity: 1,
          }),
        }),
        isExpectedStatus: (status) => status === 400 || status === 404 || status === 429,
      }
    );
  }

  return ops;
}

async function run() {
  if (!Number.isFinite(DURATION_SECONDS) || DURATION_SECONDS <= 0) {
    throw new Error("LOAD_DURATION_SECONDS invalido.");
  }
  if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
    throw new Error("LOAD_CONCURRENCY invalido.");
  }

  const operations = getOperations();
  const startedAt = Date.now();
  const stopAt = startedAt + DURATION_SECONDS * 1000;

  const totals = {
    requests: 0,
    expectedOk: 0,
    unexpected: 0,
    networkErrors: 0,
    byStatus: new Map(),
  };
  const perOp = new Map();
  for (const op of operations) {
    perOp.set(op.name, {
      requests: 0,
      expectedOk: 0,
      unexpected: 0,
      networkErrors: 0,
      latencies: [],
    });
  }

  async function workerLoop(workerId) {
    while (Date.now() < stopAt) {
      const op = pickWeighted(operations);
      const req = op.buildRequest();
      const url = `${BASE_URL}${req.path}`;
      const opStats = perOp.get(op.name);
      const started = performance.now();
      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          signal: controller.signal,
        });

        const elapsed = performance.now() - started;
        totals.requests += 1;
        opStats.requests += 1;
        opStats.latencies.push(elapsed);
        totals.byStatus.set(response.status, (totals.byStatus.get(response.status) || 0) + 1);

        if (op.isExpectedStatus(response.status)) {
          totals.expectedOk += 1;
          opStats.expectedOk += 1;
        } else {
          totals.unexpected += 1;
          opStats.unexpected += 1;
        }
      } catch (_error) {
        totals.requests += 1;
        totals.networkErrors += 1;
        opStats.requests += 1;
        opStats.networkErrors += 1;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
    return workerId;
  }

  console.log(`[${nowIso()}] load test started`);
  console.log(`baseUrl=${BASE_URL} duration=${DURATION_SECONDS}s concurrency=${CONCURRENCY}`);
  console.log(`writeScenarios=${ENABLE_WRITE_SCENARIOS ? "enabled" : "disabled"} rsvpSlug=${RSVP_SLUG || "n/a"}`);

  await Promise.all(Array.from({ length: CONCURRENCY }, (_v, i) => workerLoop(i)));

  const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const failRate = totals.requests ? (totals.unexpected + totals.networkErrors) / totals.requests : 1;
  const rps = totals.requests / elapsedSec;

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`requests=${totals.requests}`);
  console.log(`expected_ok=${totals.expectedOk}`);
  console.log(`unexpected_status=${totals.unexpected}`);
  console.log(`network_errors=${totals.networkErrors}`);
  console.log(`elapsed_seconds=${elapsedSec}`);
  console.log(`rps=${rps.toFixed(2)}`);
  console.log(`fail_rate=${(failRate * 100).toFixed(2)}%`);

  console.log("");
  console.log("=== STATUS CODES ===");
  for (const [status, count] of [...totals.byStatus.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`${status}: ${count}`);
  }

  console.log("");
  console.log("=== PER OPERATION ===");
  for (const [name, stats] of perOp.entries()) {
    const p95 = percentile(stats.latencies, 95);
    const p99 = percentile(stats.latencies, 99);
    console.log(
      `${name} req=${stats.requests} ok=${stats.expectedOk} unexpected=${stats.unexpected} neterr=${stats.networkErrors} p95=${p95.toFixed(
        1
      )}ms p99=${p99.toFixed(1)}ms`
    );
  }

  if (failRate > FAIL_RATE_THRESHOLD) {
    console.error("");
    console.error(`FAIL: fail_rate ${(failRate * 100).toFixed(2)}% > threshold ${(FAIL_RATE_THRESHOLD * 100).toFixed(2)}%`);
    process.exit(1);
  }

  console.log("");
  console.log("PASS");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
