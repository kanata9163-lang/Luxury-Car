/**
 * カーセンサー スクレーパー
 * セレクター: cassetteWrap / cassetteMain__title / cassetteMain__mainPrice
 */
const axios   = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://www.carsensor.net';

// ブランドコード
const BRANDS = [
  { code: 'LX', name: 'Lexus'    },
  { code: 'TY', name: 'Toyota'   },
  { code: 'NS', name: 'Nissan'   },
  { code: 'HN', name: 'Honda'    },
  { code: 'MZ', name: 'Mazda'    },
  { code: 'SB', name: 'Subaru'   },
];

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer':         'https://www.carsensor.net/',
};

/** 価格テキスト → 数値（万円）*/
function parsePrice(txt) {
  const m = txt.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

/** 走行距離テキスト → "12,000km" 形式 */
function parseMileage(txt) {
  const cleaned = txt.trim().replace(/\s+/g, ' ');
  const m = cleaned.match(/([\d,.]+)\s*km/i);
  return m ? m[1] + 'km' : (cleaned || '---');
}

/** 年式テキスト → "2023" */
function parseYear(txt) {
  const m = txt.match(/(\d{4})/);
  if (m) return m[1];
  // 和暦変換 (R=令和: R1=2019)
  const wa = txt.match(/R(\d+)/i);
  if (wa) return String(2018 + parseInt(wa[1]));
  const he = txt.match(/H(\d+)/i);
  if (he) return String(1988 + parseInt(he[1]));
  return txt.trim() || '---';
}

async function fetchBrand(brandCode, brandName, maxCars = 10) {
  const url = `${BASE}/usedcar/search.php?BRAND_CD=${brandCode}&PRICEMIN=300&SENRYO_CD=FR&sort=NEW`;
  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 18000 });
    const $    = cheerio.load(data);
    const cars = [];

    $('.cassetteWrap').each((i, el) => {
      if (i >= maxCars) return false;
      const $el = $(el);

      // タイトル・リンク
      const $titleLink = $el.find('.cassetteMain__title a').first();
      const rawTitle   = $titleLink.text().trim();
      if (!rawTitle) return;

      let href = $titleLink.attr('href') || '';
      if (href && !href.startsWith('http')) href = BASE + href;

      // グレード
      const grade = $el.find('.cassetteMain__subText').first().text().trim();

      // 価格
      const priceRaw = $el.find('.cassetteMain__mainPrice').first().text().trim();
      const price    = parsePrice(priceRaw);

      // 車両スペック（年式・走行距離・燃料等）
      const specs = [];
      $el.find('.carBodyInfoList__item, [class*="specInfo"] li, [class*="bodyInfo"] li').each((_, s) => {
        specs.push($(s).text().trim());
      });

      // テキストから年式・走行距離抽出
      const allText = $el.text();
      const yearMatch    = allText.match(/20\d{2}年|R\d+年|H\d+年/);
      const mileMatch    = allText.match(/([\d,]+)\s*km/);
      const fuelMatch    = allText.match(/ガソリン|ハイブリッド|ディーゼル|電気|PHEV/);
      const transMatch   = allText.match(/AT|MT|CVT|DCT/);

      const year      = yearMatch  ? parseYear(yearMatch[0])      : '---';
      const mileage   = mileMatch  ? mileMatch[1] + 'km'         : '---';
      const fuel      = fuelMatch  ? fuelMatch[0]                 : 'ガソリン';
      const trans     = transMatch ? transMatch[0]                : '---';

      // 画像（lazy-load対応）
      const $img  = $el.find('.cassetteMain__mainImg img, .cassetteMain__carImgContainer img').first();
      let imgSrc  = $img.attr('data-src') || $img.attr('data-original') || $img.attr('src') || '';
      if (imgSrc && imgSrc.includes('animation')) imgSrc = ''; // ローディングGIF除外
      if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE + imgSrc;

      // モデル名をブランド名から抽出
      const model = rawTitle.replace(new RegExp(brandName, 'gi'), '').trim() || rawTitle;

      cars.push({
        id:        `cs_${brandCode}_${i}`,
        brand:     brandName,
        model,
        grade,
        year,
        condition: 'used',
        price,
        priceText: price ? `${price}万円` : '価格応談',
        mileage,
        fuel,
        transmission: trans,
        imageUrl:  imgSrc,
        detailUrl: href,
        source:    'carsensor',
        sourceName: 'CarSensor',
      });
    });

    console.log(`[CarSensor] ${brandName}: ${cars.length} cars`);
    return cars;
  } catch (err) {
    console.error(`[CarSensor] ${brandName} error: ${err.message}`);
    return [];
  }
}

async function scrapeAll(maxPerBrand = 8) {
  const results = [];
  for (const b of BRANDS) {
    const cars = await fetchBrand(b.code, b.name, maxPerBrand);
    results.push(...cars);
    await delay(900);
  }
  return results;
}

const delay = ms => new Promise(r => setTimeout(r, ms));
module.exports = { scrapeAll, fetchBrand, BRANDS };
