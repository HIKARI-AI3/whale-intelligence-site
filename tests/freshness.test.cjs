"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { freshness, walletStats } = require("../freshness.js");
const now = Date.parse("2026-11-03T00:00:00Z");
test("freshness is independently classified", () => {
  assert.equal(freshness(new Date(now - 6 * 3600000).toISOString(), now).level, "fresh");
  assert.equal(freshness(new Date(now - 13 * 3600000).toISOString(), now).level, "delayed");
  assert.equal(freshness(new Date(now - 25 * 3600000).toISOString(), now).level, "critical");
});
test("invalid, missing and future timestamps are unknown", () => {
  for (const value of [null, "", "not a date", "2026-11-03", new Date(now + 10 * 60000).toISOString()])
    assert.equal(freshness(value, now).level, "unknown");
});
const valid = { trackedWallets: 100, successfulWallets: 100, failedWallets: 0,
  aggregates: { BTC: { longWallets: 10, shortWallets: 20, shortNotionalUsd: 100 },
    ETH: { longWallets: 4, shortWallets: 5, shortNotionalUsd: 200 } } };
test("valid sample counts are accepted", () => assert.equal(walletStats(valid).tracked, 100));
test("mismatched counts and missing aggregates are rejected", () => {
  assert.equal(walletStats({ ...valid, failedWallets: 1 }), null);
  assert.equal(walletStats({ ...valid, aggregates: {} }), null);
  assert.equal(walletStats({ ...valid, trackedWallets: -1 }), null);
});
