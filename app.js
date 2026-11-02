"use strict";
const $ = id => document.getElementById(id);
const number = (value, decimals = 2) => {
  const n = Number(value);
  return value !== null && value !== undefined && value !== "" && Number.isFinite(n)
    ? n.toLocaleString("ja-JP", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : "--";
};
const jst = value => new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + " JST";
const statusText = state => state.level === "critical" ? "24時間超の更新停止（過去データ）"
  : state.level === "delayed" ? "更新遅延（過去データ）"
  : state.level === "unknown" ? "取得時刻を確認できません" : "更新時刻確認済み";
(async () => {
  try {
    const response = await fetch("./public-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("market snapshot unavailable");
    const data = await response.json();
    if (!data || !data.markets || !data.markets.BTC || !data.markets.ETH) throw new Error("market snapshot invalid");
    const state = WIQuality.freshness(data.collectedAt);
    $("state").textContent = "市場: " + statusText(state);
    $("updated").textContent = state.level === "unknown" ? "" : "市場取得: " + jst(data.collectedAt);
    if (state.level !== "unknown") {
      for (const symbol of ["BTC", "ETH"]) {
        const value = data.markets[symbol].markPx;
        if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) > 0)
          $(symbol.toLowerCase()).textContent = "$" + number(value);
      }
    }
    $("summary").textContent = data.summary || "市場データのスナップショットです。";
    const rows = $("rows");
    for (const item of (Array.isArray(data.highlights) ? data.highlights.slice(0, 10) : [])) {
      const row = document.createElement("div"); row.className = "item";
      const title = document.createElement("span"); title.textContent = String(item.title || "市場動向");
      const detail = document.createElement("small"); detail.textContent = String(item.detail || "");
      row.append(title, detail); rows.append(row);
    }
  } catch (error) {
    $("state").textContent = "市場データを確認できません";
    $("summary").textContent = "最新データを確認できないため、市場情報の利用はお控えください。";
  }
})();
(async () => {
  const summary = $("whale-summary");
  try {
    const response = await fetch("./whales.json", { cache: "no-store" });
    if (!response.ok) throw new Error("whale snapshot unavailable");
    const data = await response.json();
    const stats = WIQuality.walletStats(data);
    const state = WIQuality.freshness(data.collectedAt);
    if (!stats || state.level === "unknown") throw new Error("whale snapshot invalid");
    $("wallets").textContent = number(stats.tracked, 0);
    summary.textContent = "クジラ集計: " + statusText(state) + " / 監視対象 " + stats.tracked +
      "口座 / 取得成功 " + stats.successful + "口座 / 失敗 " + stats.failed +
      "口座 / 取得: " + jst(data.collectedAt) +
      "。サンプル内の建玉であり、市場全体の比率ではありません。";
    const container = $("whale-rows");
    for (const symbol of ["BTC", "ETH"]) {
      const item = data.aggregates[symbol];
      const row = document.createElement("div"); row.className = "item";
      const title = document.createElement("span");
      title.textContent = symbol + " ロング " + item.longWallets + "口座 / ショート " + item.shortWallets + "口座";
      const detail = document.createElement("small");
      detail.textContent = "売り建玉 $" + Math.round(item.shortNotionalUsd).toLocaleString("ja-JP");
      row.append(title, detail); container.append(row);
    }
  } catch (error) {
    $("wallets").textContent = "--";
    summary.textContent = "クジラ集計を確認できません。取得時刻・口座数・集計の整合性が未確認です。";
  }
})();
