"""Generate Japanese daily snapshot article from public aggregate JSON.

This is a descriptive report, not an AI-generated trading recommendation.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

root=Path(__file__).resolve().parents[1]
market_path=root/"public-data.json"
whale_path=root/"whales.json"
if not market_path.exists() or not whale_path.exists():
    raise RuntimeError("Missing verified public data; do not publish an article")
market=json.loads(market_path.read_text(encoding="utf-8"))
whales=json.loads(whale_path.read_text(encoding="utf-8"))
for coin in ("BTC","ETH"):
    if coin not in market.get("markets",{}) or coin not in whales.get("aggregates",{}):
        raise RuntimeError("Incomplete data")
stamp=datetime.fromisoformat(whales["collectedAt"].replace("Z","+00:00"))
if (datetime.now(timezone.utc)-stamp).total_seconds()>86400:
    raise RuntimeError("Whale data older than 24h; refuse to publish")
date=stamp.astimezone(timezone.utc).strftime("%Y-%m-%d")
lines=[
    "# Hyperliquid 大口資金動向レポート",
    "",
    f"クジラ集計取得時刻（UTC）：{whales['collectedAt']}",
    f"市場データ取得時刻（UTC）：{market['collectedAt']}",
    "",
    "## BTC・ETH市場",
]
for coin in ("BTC","ETH"):
    m=market["markets"][coin]
    lines.append(f"- {coin} マーク価格：{m['markPx']} USD、建玉数量：{m['openInterest']}")
lines.extend(["","## 選定100口座の建玉内訳"])
for coin in ("BTC","ETH"):
    a=whales["aggregates"][coin]
    lines.append(f"- {coin}：ロング {a['longWallets']} 口座（評価額 {a['longNotionalUsd']:,.0f} USD）、ショート {a['shortWallets']} 口座（評価額 {a['shortNotionalUsd']:,.0f} USD）")
lines.extend([
    "",
    f"追跡対象：{whales['trackedWallets']} 口座／取得成功：{whales['successfulWallets']} 口座／失敗：{whales['failedWallets']} 口座",
    "",
    "## 集計方法と注意",
    "Hyperliquidの公開ランキングから、口座資産額40・直近月間損益40・日次取引量20を重複除外して選定しています。",
    "同一ウォレットが複数銘柄の建玉を持つことがあり、口座数は足し算できません。",
    "この集計は選定サンプルのスナップショットです。市場全体の売買比率やクジラの意図を示すものではありません。",
    "他取引所でのヘッジは把握できません。投資助言や売買推奨ではありません。",
])
out=root/"reports"
out.mkdir(exist_ok=True)
(out/"latest.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print("Japanese report created:",date)
