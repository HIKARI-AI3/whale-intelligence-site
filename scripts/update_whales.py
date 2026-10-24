"""Publish anonymized Hyperliquid whale position aggregates.

All source data is public. No private-repository access, tokens, or raw wallet
addresses are required or written to the public repository.
"""
import json
import math
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

LEADERBOARD = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard"
INFO = "https://api.hyperliquid.xyz/info"
ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")
TARGETS = (("capital", 40), ("profit_30d", 40), ("active_24h", 20))

def fetch(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = Request(url, data=data, method="POST" if data else "GET",
                  headers={"User-Agent": "WhaleIntelligenceJapan/0.3",
                           "Content-Type": "application/json"})
    with urlopen(req, timeout=120 if url == LEADERBOARD else 30) as response:
        return json.load(response)

def metric(row, category):
    try:
        if category == "capital":
            value = row.get("accountValue")
        else:
            periods = dict(row.get("windowPerformances") or [])
            period = periods.get("month" if category == "profit_30d" else "day") or {}
            value = period.get("pnl" if category == "profit_30d" else "vlm")
        n = float(value)
        return n if math.isfinite(n) else 0
    except (ValueError, TypeError):
        return 0

def choose(rows):
    valid = {}
    for row in rows:
        if isinstance(row, dict):
            addr = str(row.get("ethAddress", "")).lower()
            if ADDRESS.fullmatch(addr):
                valid[addr] = row
    selected = []
    used = set()
    for category, count in TARGETS:
        ranked = sorted(valid.items(), key=lambda item: (-metric(item[1], category), item[0]))
        cohort = [addr for addr, row in ranked if addr not in used and metric(row, category) > 0][:count]
        if len(cohort) < count:
            raise RuntimeError("Not enough qualified public leaderboard wallets")
        selected.extend(cohort)
        used.update(cohort)
    return selected

def get_account(address):
    try:
        state = fetch(INFO, {"type": "clearinghouseState", "user": address})
        return state.get("assetPositions", []), True
    except Exception:
        return [], False

def main():
    rows = fetch(LEADERBOARD).get("leaderboardRows")
    if not isinstance(rows, list):
        raise RuntimeError("Leaderboard format changed")
    wallets = choose(rows)
    with ThreadPoolExecutor(max_workers=4) as pool:
        accounts = list(pool.map(get_account, wallets))
    successes = sum(ok for _, ok in accounts)
    if successes < 90:
        raise RuntimeError(f"Only {successes}/100 wallets fetched; keep old public data")
    aggregates = {}
    for coin in ("BTC", "ETH"):
        long_count = short_count = 0
        long_usd = short_usd = 0.0
        for positions, ok in accounts:
            if not ok:
                continue
            for entry in positions:
                position = entry.get("position", {})
                if position.get("coin") != coin:
                    continue
                try:
                    size = float(position.get("szi") or 0)
                    notional = abs(float(position.get("positionValue") or 0))
                    if not math.isfinite(size) or not math.isfinite(notional):
                        continue
                except (TypeError, ValueError):
                    continue
                if size > 0:
                    long_count += 1
                    long_usd += notional
                elif size < 0:
                    short_count += 1
                    short_usd += notional
        aggregates[coin] = {"longWallets": long_count, "shortWallets": short_count,
                            "longNotionalUsd": round(long_usd, 2),
                            "shortNotionalUsd": round(short_usd, 2)}
    output = {
        "collectedAt": datetime.now(timezone.utc).isoformat(),
        "trackedWallets": len(wallets),
        "successfulWallets": successes,
        "failedWallets": len(wallets) - successes,
        "aggregates": aggregates,
        "methodology": "40 highest account value, 40 highest positive monthly PnL, 20 highest positive daily volume; deduplicated Hyperliquid public leaderboard addresses.",
        "caveat": "A selected sample, not the entire exchange. Positions do not reveal hedges or trader intent. Cohort membership can change between runs."
    }
    Path("whales.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Published aggregate only: {successes}/100 wallets")

if __name__ == "__main__":
    main()
