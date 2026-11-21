"use strict";
const WIQuality = (() => {
  const HOUR = 3600000;
  function freshness(value, now = Date.now()) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
      return { level: "unknown", ageHours: null };
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp) || !Number.isFinite(now) || timestamp - now > 5 * 60000)
      return { level: "unknown", ageHours: null };
    const ageHours = Math.max(0, (now - timestamp) / HOUR);
    return { level: ageHours > 24 ? "critical" : ageHours > 12 ? "delayed" : "fresh", ageHours };
  }
  function walletStats(data) {
    if (!data || typeof data !== "object") return null;
    const { trackedWallets: tracked, successfulWallets: successful, failedWallets: failed } = data;
    if (![tracked, successful, failed].every(n => Number.isSafeInteger(n) && n >= 0)) return null;
    if (successful + failed !== tracked) return null;
    if (!data.aggregates || typeof data.aggregates !== "object") return null;
    for (const symbol of ["BTC", "ETH"]) {
      const item = data.aggregates[symbol];
      if (!item || !["longWallets", "shortWallets", "shortNotionalUsd"].every(
        key => typeof item[key] === "number" && Number.isFinite(item[key]) && item[key] >= 0
      )) return null;
    }
    return { tracked, successful, failed };
  }
  return { freshness, walletStats };
})();
if (typeof module !== "undefined" && module.exports) module.exports = WIQuality;
