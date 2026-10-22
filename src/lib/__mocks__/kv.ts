import { vi } from "vitest";

export const kv = {
  get: vi.fn(),
  set: vi.fn(),
  zrange: vi.fn(),
  zadd: vi.fn(),
  zremrangebyrank: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn()
};
