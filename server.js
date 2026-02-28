/**
 * PRESTIGE JAPAN — Express バックエンドサーバー
 * グーネット・カーセンサー等からリアルタイムスクレイピング
 */
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const NodeCache = require('node-cache');

const goonet    = require('./scrapers/goonet');

const app   = express();
const cache = new NodeCache({ stdTTL: 7200 }); // 2時間キャッシュ

app.use(cors());
app.use(express.json());

// ── 静的ファイル配信（HTML/CSS/JS/画像）────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── API: 全車両取得 ────────────────────────────────────────────────────────
app.get('/api/cars', async (req, res) => {
  const brand  = req.query.brand  || 'all';
  const sort   = req.query.sort   || 'default';
  const search = req.query.search || '';
  const page   = parseInt(req.query.page) || 1;
  const limit  = parseInt(req.query.limit) || 60;

  try {
    // キャッシュから取得（scraping完了済みデータ）
    let allCars = cache.get('all_cars');

    if (!allCars) {
      console.log('[Server] Scraping started — 超高級車 2000万円以上...');
      const [gnCars] = await Promise.allSettled([
        goonet.scrapeAll(),
      ]);

      const raw = (gnCars.status === 'fulfilled' ? gnCars.value : []);

      // ── 2000万円以上のみ（超高級車フィルター） ───────────────────────
      allCars = raw
        .filter(c => c.price && c.price >= 2000)
        .sort((a, b) => (b.price || 0) - (a.price || 0))  // デフォルト: 高額順
        .map((c, i) => ({ ...c, rank: i + 1 }));

      cache.set('all_cars', allCars);
      console.log(`[Server] Scraping complete: ${raw.length} total → ${allCars.length} cars (2000万円以上)`);
    }

    // フィルタリング
    let filtered = [...allCars];

    if (brand !== 'all') {
      filtered = filtered.filter(c =>
        c.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.model.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        (c.grade || '').toLowerCase().includes(q)
      );
    }

    // ソート
    if (sort === 'price-asc')  filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'price-desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === 'year-desc')  filtered.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
    if (sort === 'year-asc')   filtered.sort((a, b) => parseInt(a.year || 0) - parseInt(b.year || 0));

    // ページネーション
    const total  = filtered.length;
    const offset = (page - 1) * limit;
    const cars   = filtered.slice(offset, offset + limit);

    res.json({
      success: true,
      total,
      page,
      limit,
      brands: [...new Set(allCars.map(c => c.brand))].sort(),
      cars,
    });
  } catch (err) {
    console.error('[Server] /api/cars error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── API: キャッシュクリア（手動スクレイプ更新） ──────────────────────────
app.post('/api/refresh', (req, res) => {
  cache.del('all_cars');
  console.log('[Server] Cache cleared');
  res.json({ success: true, message: 'キャッシュをクリアしました。次のリクエストで再スクレイピングします。' });
});

// ── API: ステータス ────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const cached = cache.get('all_cars');
  res.json({
    status: 'running',
    cachedCars: cached ? cached.length : 0,
    cacheKeys: cache.keys(),
    uptime: process.uptime(),
  });
});

// ── 起動 ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚗 PRESTIGE JAPAN Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/cars`);
  console.log(`   Refresh: POST http://localhost:${PORT}/api/refresh\n`);
});
