/**
 * Vercel ビルド時スクレイピング
 * `vercel build` → このスクリプトがGooNetをスクレイプ → cars.json を生成
 */
const goonet = require('./scrapers/goonet');
const fs     = require('fs');
const path   = require('path');

async function build() {
  console.log('[Build] Starting GooNet scrape...');
  const startTime = Date.now();

  const raw = await goonet.scrapeAll();

  // 2000万円以上フィルター + 高額順ソート
  const cars = raw
    .filter(c => c.price && c.price >= 2000)
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const brands = [...new Set(cars.map(c => c.brand))].sort();

  const data = {
    success: true,
    total: cars.length,
    brands,
    cars,
    generatedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, 'cars.json');
  fs.writeFileSync(outPath, JSON.stringify(data));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Build] Done: ${raw.length} total → ${cars.length} cars (≥2000万円) in ${elapsed}s`);
  console.log(`[Build] Saved to ${outPath}`);
}

build().catch(err => {
  console.error('[Build] Fatal error:', err);
  process.exit(1);
});
