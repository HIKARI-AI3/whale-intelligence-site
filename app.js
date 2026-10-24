"use strict";
const $=id=>document.getElementById(id);
const number=(v,decimals=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString("ja-JP",{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):"--"};
(async()=>{
 try{
  const response=await fetch("./public-data.json",{cache:"no-store"});
  if(!response.ok)throw new Error("not published");
  const data=await response.json();
  if(!data || typeof data!=="object" || !data.markets)throw new Error("invalid data");
  $("btc").textContent=data.markets.BTC?.markPx?"$"+number(data.markets.BTC.markPx):"--";
  $("eth").textContent=data.markets.ETH?.markPx?"$"+number(data.markets.ETH.markPx):"--";
  $("wallets").textContent=Number.isInteger(data.walletCount)?number(data.walletCount,0):"--";
  $("updated").textContent=data.collectedAt?"取得: "+new Date(data.collectedAt).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"})+" JST":"";
  $("state").textContent="公開データを表示中";
  $("summary").textContent=data.summary||"公開済みの市場スナップショットを表示しています。";
  const rows=$("rows");
  for(const item of (Array.isArray(data.highlights)?data.highlights.slice(0,10):[])){
   const row=document.createElement("div");row.className="item";
   const title=document.createElement("span");title.textContent=String(item.title||"市場動向");
   const value=document.createElement("small");value.textContent=String(item.detail||"");
   row.append(title,value);rows.append(row);
  }
 }catch(e){$("state").textContent="公開準備中";$("summary").textContent="公開用データの検証と連携を進めています。未検証の取引シグナルは掲載しません。"}
})();
(async()=>{
 try {
  const res=await fetch("./whales.json",{cache:"no-store"});
  if(!res.ok) return;
  const data=await res.json();
  if(!data.aggregates || !data.collectedAt) return;
  const summary=document.getElementById("whale-summary");
  summary.textContent="監視対象 "+data.trackedWallets+"口座 / 取得成功 "+data.successfulWallets+"口座 / 取得: "+new Date(data.collectedAt).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"})+" JST。サンプル内の建玉であり、市場全体の比率ではありません。";
  const container=document.getElementById("whale-rows");
  for(const symbol of ["BTC","ETH"]){
   const item=data.aggregates[symbol];if(!item)continue;
   const row=document.createElement("div");row.className="item";
   const title=document.createElement("span");title.textContent=symbol+" ロング "+item.longWallets+"口座 / ショート "+item.shortWallets+"口座";
   const detail=document.createElement("small");detail.textContent="売り建玉 $"+Math.round(item.shortNotionalUsd).toLocaleString("ja-JP");
   row.append(title,detail);container.append(row);
  }
 }catch(e){/* Keep the honest staging message when data is unavailable. */}
})();
