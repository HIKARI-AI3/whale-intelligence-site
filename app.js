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