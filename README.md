# Whale Intelligence Japan 公開データ

- `public-data.json`: BTC/ETH市場スナップショット。取得時刻は `collectedAt`。
- `whales.json`: 監視対象ウォレットの集計スナップショット。取得時刻は `collectedAt`。
- 監視口座数の正本は `whales.json.trackedWallets` です。`public-data.json.walletCount` は市場専用データのため廃止します。旧フィールドを参照する外部利用者は移行してください。
- 公開画面は両ファイルの更新鮮度を独立評価します。12時間超は更新遅延、24時間超は強い警告。不正・未来時刻は未確認として扱います。
- 取得成功した監視対象は市場全体を代表しません。売買推奨や収益保証ではありません。

品質検証: `node --test tests/*.test.cjs`
