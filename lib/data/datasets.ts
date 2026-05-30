// Deterministic mock data — no randomness, so the executor tests and the UI see
// the same records every run. Each generator cycles through small pools to make
// records that read like real data without hand-writing 150 rows.

// The index signature lets these records flow into the executor, which reads
// fields dynamically by key from the query tree.
export interface User {
  [key: string]: unknown;
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  country: string;
  createdAt: string;
  purchaseCount: number;
}

export interface Order {
  [key: string]: unknown;
  id: number;
  orderId: string;
  amount: number;
  status: string;
  customerId: string;
  region: string;
  createdAt: string;
  items: number;
}

export interface Product {
  [key: string]: unknown;
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  active: boolean;
}

export interface LogEntry {
  [key: string]: unknown;
  id: number;
  level: string;
  message: string;
  service: string;
  timestamp: string;
}

function dayOffset(start: string, days: number): string {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const NAMES = [
  "Ada Lovelace", "Grace Hopper", "Alan Turing", "Linus Torvalds",
  "Margaret Hamilton", "Dennis Ritchie", "Barbara Liskov", "Ken Thompson",
  "Katherine Johnson", "Donald Knuth", "Radia Perlman", "Tim Berners-Lee",
];
const COUNTRIES = ["US", "UK", "Germany", "Japan", "Brazil", "Canada", "India", "France"];
const USER_STATUSES = ["active", "inactive", "pending"];

export const users: User[] = Array.from({ length: 150 }, (_, i) => {
  const name = NAMES[i % NAMES.length];
  return {
    id: i + 1,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i}@example.com`,
    age: 18 + ((i * 7) % 50),
    status: USER_STATUSES[i % USER_STATUSES.length],
    country: COUNTRIES[i % COUNTRIES.length],
    createdAt: dayOffset("2023-01-01", (i * 3) % 700),
    purchaseCount: (i * 5) % 40,
  };
});

const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];
const REGIONS = ["NA", "EU", "APAC", "LATAM"];

export const orders: Order[] = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  orderId: `ORD-${String(1000 + i)}`,
  amount: Math.round((20 + ((i * 13.5) % 480)) * 100) / 100,
  status: ORDER_STATUSES[i % ORDER_STATUSES.length],
  customerId: `CUST-${String(100 + (i % 60))}`,
  region: REGIONS[i % REGIONS.length],
  createdAt: dayOffset("2024-01-01", (i * 2) % 500),
  items: 1 + (i % 9),
}));

const PRODUCT_NAMES = [
  "Aurora Lamp", "Nimbus Keyboard", "Halcyon Mug", "Vertex Chair",
  "Echo Speaker", "Lumen Monitor", "Drift Backpack", "Pulse Watch",
  "Cobalt Notebook", "Ember Mouse",
];
const CATEGORIES = ["electronics", "books", "clothing", "home", "toys"];

export const products: Product[] = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  name: `${PRODUCT_NAMES[i % PRODUCT_NAMES.length]} ${Math.floor(i / PRODUCT_NAMES.length) + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  price: Math.round((5 + ((i * 9.99) % 300)) * 100) / 100,
  stock: (i * 11) % 200,
  rating: Math.round((1 + ((i * 0.7) % 4)) * 10) / 10,
  active: i % 4 !== 0,
}));

const LEVELS = ["info", "warn", "error"];
const SERVICES = ["api", "auth", "db", "worker", "gateway"];
const MESSAGES = [
  "request completed",
  "cache miss",
  "connection retried",
  "validation failed",
  "token refreshed",
  "rate limit reached",
  "job enqueued",
  "slow query detected",
];

export const logs: LogEntry[] = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  level: LEVELS[i % LEVELS.length],
  message: MESSAGES[i % MESSAGES.length],
  service: SERVICES[i % SERVICES.length],
  timestamp: dayOffset("2025-01-01", (i * 1) % 150),
}));

export const DATASETS: Record<string, Array<Record<string, unknown>>> = {
  users,
  orders,
  products,
  logs,
};
