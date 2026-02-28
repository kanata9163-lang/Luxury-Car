/**
 * グーネット スクレーパー（超高級車専用版）
 * 対象: フェラーリ・ランボルギーニ・ポルシェ・ベントレー他 2000万円以上
 * URL: /cgi-bin/fsearch/goo_used_search.cgi?category=USDN&phrase=<日本語メーカー名>
 */
const axios   = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://www.goo-net.com';
const CGI  = `${BASE}/cgi-bin/fsearch/goo_used_search.cgi`;

// ── 超高級車ブランド一覧（グーネットでの日本語検索ワード） ─────────────────
// 各ブランドをPRICE_DESC/NEW/YEAR_DESCの3種類でスクレイプ → 最大90件/ブランド
const BRANDS = [
  // ── ビッグ3（Ferrari / Lamborghini / Porsche） ─────────────────────────
  { phrase: 'フェラーリ',             name: 'Ferrari'      },
  { phrase: 'フェラーリ ローマ',       name: 'Ferrari'      },
  { phrase: 'フェラーリ 488',          name: 'Ferrari'      },
  { phrase: 'フェラーリ SF90',         name: 'Ferrari'      },
  { phrase: 'ランボルギーニ',           name: 'Lamborghini'  },
  { phrase: 'ランボルギーニ ウルス',    name: 'Lamborghini'  },
  { phrase: 'ランボルギーニ ウラカン',  name: 'Lamborghini'  },
  { phrase: 'ポルシェ 918',            name: 'Porsche'      },
  { phrase: 'ポルシェ カレラGT',       name: 'Porsche'      },
  { phrase: 'ポルシェ GT2',            name: 'Porsche'      },
  { phrase: 'ポルシェ GT3',            name: 'Porsche'      },
  // ── ブリティッシュ高級車 ──────────────────────────────────────────────
  { phrase: 'ベントレー',              name: 'Bentley'      },
  { phrase: 'ロールスロイス',          name: 'Rolls-Royce'  },
  { phrase: 'マクラーレン',            name: 'McLaren'      },
  { phrase: 'アストンマーティン',      name: 'Aston Martin' },
  // ── その他スーパーカー ────────────────────────────────────────────────
  { phrase: 'マセラティ',              name: 'Maserati'     },
  { phrase: 'ブガッティ',              name: 'Bugatti'      },
  { phrase: 'AMG GT',                  name: 'Mercedes-AMG' },
  { phrase: 'AMG ブラックシリーズ',    name: 'Mercedes-AMG' },
  { phrase: 'マイバッハ',              name: 'Maybach'      },
  { phrase: 'パガーニ',                name: 'Pagani'       },
  { phrase: 'ケーニグセグ',            name: 'Koenigsegg'   },
];

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer':         'https://www.goo-net.com/',
};

function parsePrice(txt) {
  const clean = (txt || '').replace(/,/g, '').replace(/[^\d.]/g, '');
  return clean ? parseFloat(clean) : null;
}

function parseYear(txt) {
  const m4 = txt.match(/20(\d{2})/);
  if (m4) return '20' + m4[1];
  const wa = txt.match(/R(\d+)/i);
  if (wa) return String(2018 + parseInt(wa[1]));
  const he = txt.match(/H(\d+)/i);
  if (he) return String(1988 + parseInt(he[1]));
  return null;
}

// 全角英数を半角に変換
function toHalf(str) {
  return (str || '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  ).replace(/　/g, ' ');
}

// ── 1ページ分をスクレイプ（リトライ付き） ────────────────────────────────
async function fetchPage(phrase, brandName, order = 'PRICE_DESC', maxCars = 30) {
  const url = `${CGI}?category=USDN&phrase=${encodeURIComponent(phrase)}&price_from=1000&order=${order}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await axios.get(url, {
        headers: HEADERS,
        timeout: 30000,
        validateStatus: s => s === 200 || s === 404,   // 404 = 0件ヒット（正常）
      });

      // 404 = GooNet上で検索結果 0 件 → リトライ不要、即 return
      if (resp.status === 404) {
        console.log(`[GooNet] ${brandName} [${phrase}] ${order}: 0 results (404) — skipping`);
        return [];
      }

      const data = resp.data;
      const $ = cheerio.load(data, { xmlMode: false });
      const cars = [];

      // .section は <div class="section"> (DIV要素)
      $('.section').each((i, el) => {
        if (i >= maxCars) return false;
        const $el = $(el);

        // .car_name は <a> 要素（リンク自体がcar_name）
        const $link = $el.find('.car_name').first();
        const href  = $link.attr('href') || '';
        if (!href) return;

        // モデル名（.ttl）
        const $ttls   = $link.find('.ttl');
        const makerTx = toHalf($($ttls[0]).text().trim());
        const modelTx = toHalf($($ttls[1]).text().trim());
        if (!modelTx) return;

        // グレード
        const grade = $link.find('.txt').first().text().trim();

        // 価格（支払総額 .num-red 優先）
        const priceRaw = $el.find('.num-red').first().text().trim()
                      || $el.find('.num').first().text().trim();
        const price    = parsePrice(priceRaw);

        // 年式・燃料・ミッション（全テキストから）
        const allText  = $el.text();
        const yearM    = allText.match(/20\d{2}年|R\d+年|H\d+年/);
        const fuelM    = allText.match(/ガソリン|ハイブリッド|ディーゼル|電気|PHV|PHEV/);
        const transM   = allText.match(/\b(AT|MT|CVT|DCT|PDK|DSG)\b/);

        const year         = yearM  ? parseYear(yearM[0])  : null;
        const fuelRaw      = fuelM  ? fuelM[0]             : 'ガソリン';
        const transmission = transM ? transM[0]            : '---';

        // 走行距離: <li><span>走行距離</span>352km</li> または 0.3万km
        // 保証テキスト「10000km」等を誤マッチしないよう専用LIから取得
        let mileage = '---';
        $el.find('li').each((j, li) => {
          const $li   = $(li);
          const label = $li.find('span').first().text();
          if (label.includes('走行')) {
            const raw = $li.text().replace(label, '').trim();
            const manM = raw.match(/([\d.]+)万km/);
            if (manM) {
              const km = Math.round(parseFloat(manM[1]) * 10000);
              mileage = km.toLocaleString() + ' km';
            } else {
              const kmM = raw.match(/([\d,]+)\s*km/i);
              if (kmM) mileage = parseInt(kmM[1].replace(/,/g, '')).toLocaleString() + ' km';
            }
            return false; // break
          }
        });

        // 燃料を英語に変換
        const fuelMap = { 'ガソリン':'Gasoline', 'ハイブリッド':'Hybrid', 'ディーゼル':'Diesel', '電気':'Electric', 'PHV':'PHEV', 'PHEV':'PHEV' };
        const fuel = fuelMap[fuelRaw] || fuelRaw;

        // 画像（data-src で lazy-load）
        const $img = $el.find('.visual img').first();
        let imgSrc = $img.attr('data-src') || $img.attr('data-original') || '';
        if (imgSrc && imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
        if (!imgSrc || imgSrc.includes('noimage') || imgSrc.includes('no_img') || imgSrc.length < 20) {
          imgSrc = '';
        }

        const fullUrl = href.startsWith('http') ? href : BASE + href;

        cars.push({
          id:           `gn_${brandName.toLowerCase().replace(/[^a-z]/g,'')}_${order}_${i}`,
          brand:        brandName,
          model:        modelTx,
          grade,
          year,
          condition:    'used',
          price,
          priceText:    price ? `${price.toLocaleString()}万円` : '価格応談',
          mileage,
          fuel,
          transmission,
          imageUrl:     imgSrc,
          detailUrl:    fullUrl,
          source:       'goonet',
          sourceName:   'Goo-Net',
          _srcUrl:      fullUrl,
        });
      });

      return cars; // success — return immediately

    } catch (err) {
      console.warn(`[GooNet] ${brandName} [${order}] attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) await delay(attempt * 1500); // wait 1.5s, then 3s before retry
    }
  }

  console.error(`[GooNet] ${brandName} [${order}] all 3 attempts failed — skipping`);
  return [];
}

// ── 複数ソートでスクレイプ（重複除去してユニーク車両を最大化） ─────────────
async function fetchBrand(phrase, brandName, _unused, maxPerFetch = 30) {
  const allCars = [];
  const seenUrls = new Set();
  // 3種のソート順でスクレイプ → 最大90件 (実際は重複あり)
  const orders = ['PRICE_DESC', 'NEW', 'YEAR_DESC'];

  for (const order of orders) {
    const cars = await fetchPage(phrase, brandName, order, maxPerFetch);
    let newCount = 0;
    for (const car of cars) {
      if (!seenUrls.has(car._srcUrl)) {
        seenUrls.add(car._srcUrl);
        allCars.push(car);
        newCount++;
      }
    }
    console.log(`[GooNet] ${brandName} [${phrase}] ${order}: ${cars.length} fetched, ${newCount} new (total: ${allCars.length})`);
    if (cars.length < 3) break;
    await delay(400);
  }

  return allCars;
}

// ── 全ブランドスクレイプ ──────────────────────────────────────────────────
async function scrapeAll() {
  const results = [];
  const seenUrls = new Set();

  for (const b of BRANDS) {
    const cars = await fetchBrand(b.phrase, b.name, null, 30);
    for (const car of cars) {
      if (!seenUrls.has(car._srcUrl)) {
        seenUrls.add(car._srcUrl);
        results.push(car);
      }
    }
    await delay(800);
  }

  console.log(`[GooNet] 全ブランド合計: ${results.length} 台（重複除去済み）`);
  return results;
}

const delay = ms => new Promise(r => setTimeout(r, ms));
module.exports = { scrapeAll, fetchBrand, BRANDS };
