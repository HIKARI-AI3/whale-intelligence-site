"""Fetch only public BTC/ETH market metrics for GitHub Pages. No wallet data."""
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

API="https://api.hyperliquid.xyz/info"
request=Request(API,data=json.dumps({"type":"metaAndAssetCtxs"}).encode(),headers={"Content-Type":"application/json","User-Agent":"WhaleIntelligenceJapan/0.1"},method="POST")
with urlopen(request,timeout=30) as response:
    metadata, contexts=json.load(response)
markets={}
for i,asset in enumerate(metadata.get("universe",[])):
    symbol=asset.get("name")
    if symbol in ("BTC","ETH"):
        context=contexts[i]
        markets[symbol]={"markPx":context.get("markPx"),"openInterest":context.get("openInterest")}
if set(markets)!={"BTC","ETH"}:
    raise RuntimeError("BTC/ETH market data missing; keep previous published snapshot")
output={"collectedAt":datetime.now(timezone.utc).isoformat(),"markets":markets,"walletCount":0,"summary":"BTC・ETHの市場データを表示しています。大口ウォレットの分析は準備中です。","highlights":[]}
Path("public-data.json").write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Public market snapshot written")
