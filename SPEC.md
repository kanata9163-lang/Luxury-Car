# TCV LUXURY - サイト仕様書

**最終更新日:** 2026-04-01
**本番URL:** https://tcv-luxury.vercel.app/
**リポジトリ:** https://github.com/kanata9163-lang/Luxury-Car

---

## 1. サイト概要

| 項目 | 内容 |
|------|------|
| サイト名 | TCV LUXURY |
| コンセプト | 日本国内の超高級車を海外バイヤー向けに集約・紹介するLP |
| 言語 | 英語（モデル名はGooNetの日本語→英語に自動翻訳） |
| ターゲット | 海外の高級車購入希望者（広告LP経由） |
| 目的 | WhatsApp経由のリード獲得（CV = WhatsApp問い合わせ） |
| ホスティング | Vercel |
| フレームワーク | なし（静的HTML + Vanilla JS） |

---

## 2. テクノロジースタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | HTML / CSS / Vanilla JavaScript |
| バックエンド | Node.js (Express) - ローカル開発用 |
| スクレイピング | axios + cheerio |
| ビルド | `node build.js`（Vercelビルド時にGooNetスクレイプ → `cars.json` 生成） |
| 画像プロキシ | Vercel Serverless Function (`api/img.js`) |
| デプロイ | Vercel (自動ビルド + 静的配信) |
| キャッシュ | node-cache (ローカル開発用) |

### 依存パッケージ (`package.json`)

```json
{
  "dependencies": {
    "axios": "^1.7.9",
    "cheerio": "^1.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "node-cache": "^5.1.2"
  }
}
```

---

## 3. ファイル構成

```
luxury-cars/
├── index.html           # メインページ（HTML/CSS/JS 一体型）
├── cars.json            # ビルド時生成される車両データ
├── img_hero.jpg         # ヒーロー画像
├── rogo.png             # ロゴ / ファビコン
├── build.js             # Vercelビルドスクリプト
├── server.js            # ローカル開発用Expressサーバー
├── package.json         # NPM設定
├── vercel.json          # Vercel設定
├── api/
│   └── img.js           # 画像プロキシ（Serverless Function）
├── scrapers/
│   └── goonet.js        # GooNetスクレイパー
└── .gitignore
```

---

## 4. データソース・スクレイピング仕様

### 4.1 対象ブランド（22検索ワード → 12ブランド）

| ブランド | GooNet検索ワード |
|----------|-----------------|
| Ferrari | `フェラーリ`, `フェラーリ ローマ`, `フェラーリ 488`, `フェラーリ SF90` |
| Lamborghini | `ランボルギーニ`, `ランボルギーニ ウルス`, `ランボルギーニ ウラカン` |
| Porsche | `ポルシェ 918`, `ポルシェ カレラGT`, `ポルシェ GT2`, `ポルシェ GT3` |
| Bentley | `ベントレー` |
| Rolls-Royce | `ロールスロイス` |
| McLaren | `マクラーレン` |
| Aston Martin | `アストンマーティン` |
| Maserati | `マセラティ` |
| Bugatti | `ブガッティ` |
| Mercedes-AMG | `AMG GT`, `AMG ブラックシリーズ` |
| Maybach | `マイバッハ` |
| Pagani | `パガーニ` |
| Koenigsegg | `ケーニグセグ` |

### 4.2 スクレイピングフロー

1. **ビルド時** (`vercel build` → `node build.js`)
2. 各ブランドを `PRICE_DESC` / `NEW` / `YEAR_DESC` の3ソートで取得（最大90件/ブランド）
3. GooNet CGI URL: `https://www.goo-net.com/cgi-bin/fsearch/goo_used_search.cgi`
4. 重複除去（URL単位）
5. **2000万円以上フィルター** → 高額順ソート → `cars.json` に保存
6. 画像URLを `/J/`（サムネイル）→ `/L/`（高解像度）に自動アップグレード

### 4.3 車両データ構造（`cars.json`）

```json
{
  "success": true,
  "total": 279,
  "brands": ["Aston Martin", "Bentley", "Ferrari", ...],
  "cars": [
    {
      "brand": "Ferrari",
      "model": "SF90スパイダー",
      "grade": "...",
      "year": "2022",
      "price": 8980,
      "mileage": "3,000 km",
      "engine": "6.5L V12",
      "transmission": "AT",
      "fuel": "Gasoline",
      "color": "...",
      "imageUrl": "https://www.goo-net.com/.../L/...",
      "detailUrl": "https://www.goo-net.com/...",
      "dealer": "...",
      "location": "...",
      "source": "Goo-Net",
      "rank": 1
    }
  ],
  "generatedAt": "2026-04-01T..."
}
```

---

## 5. 画像プロキシ（`api/img.js`）

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/img?url=<エンコード済み画像URL>` |
| 機能 | GooNetのReferer制限を回避 + 高解像度自動アップグレード |
| ロジック | `/J/` → `/L/` に置換して取得。失敗時は `/J/` にフォールバック |
| キャッシュ | `Cache-Control: public, max-age=86400, s-maxage=86400`（24時間） |
| タイムアウト | 15秒 |
| Vercel設定 | `maxDuration: 15` |

---

## 6. フロントエンド仕様

### 6.1 ページ構成

| セクション | 内容 |
|-----------|------|
| **Loading Screen** | ロゴ + プログレスバー（データ読込完了まで表示） |
| **Navigation** | ロゴ(`rogo.png`) + CATALOG / SERVICES / CONTACT リンク + テーマトグル |
| **Hero** | 背景画像(`img_hero.jpg`) + "THE FINEST ON EARTH" + 統計カウンター |
| **Marquee** | ブランド名スクロール表示 |
| **Filter Section** | 検索バー + ソートドロップダウン + ブランドドロップダウン |
| **Cars Grid** | 車両カード（8台ずつLoad More形式） |
| **CTA Banner** | 4枚目のカードの後に挿入。"GET THE BEST PRICE ON YOUR DREAM CAR" |
| **Features** | PRECISION SEARCH / CONCIERGE SERVICE / GLOBAL SHIPPING の3カード |
| **Footer** | ロゴ + コピーライト |
| **Lead Form Modal** | WhatsApp遷移前のリード情報取得フォーム |
| **Contact Modal** | NAV "CONTACT" クリック時のWhatsApp/Email連絡先 |
| **Car Detail Modal** | カード画像クリック時の車両詳細表示 |

### 6.2 Load More ページネーション

- **初期表示:** 8台 (`CARS_PER_PAGE = 8`)
- **Load More:** 8台ずつ追加
- **CTA挿入位置:** 4枚目の後 (`CTA_AFTER = 4`)
- **リセット条件:** フィルター変更 / 検索 / ソート変更時に8台にリセット

### 6.3 日本語→英語モデル名翻訳

クライアントサイドの `modelNameMap`（約60エントリ）で日本語カタカナ → 英語に変換:

| 日本語 | 英語 |
|--------|------|
| スパイダー | Spider |
| プロサングエ | Purosangue |
| カリナン | Cullinan |
| ウラカン | Huracán |
| ウルス | Urus |
| アヴェンタドール | Aventador |
| ピスタ | Pista |
| ...（約60件） | ... |

追加処理:
- 全角英数字 → 半角変換
- `　`（全角スペース）→ 半角スペース
- `・`（中点）→ 半角スペース
- `([0-9])([A-Z])` → `$1 $2`（数字と大文字の間にスペース挿入）

### 6.4 テーマ

- **ライトモード（デフォルト）:** `data-theme="light"` — クリーム系背景
- **ダークモード:** デフォルトCSS変数 — ブラック背景
- **保存先:** `localStorage` (`tcv-theme`)
- **切替:** ナビゲーションの☽/☀ボタン

### 6.5 レスポンシブ対応

| ブレークポイント | 主な調整 |
|-----------------|---------|
| `pointer: coarse` | カスタムカーソル非表示 |
| `≤ 900px` | ナビリンク非表示、パディング縮小、モーダル・CTA調整 |
| `≤ 600px` | 1カラムグリッド、検索・フィルター縦積み、画像高さ240px |

### 6.6 UI演出

- **カスタムカーソル:** ゴールド円 + リング（タッチデバイスは非表示）
- **パーティクルキャンバス:** 背景に浮遊するゴールドパーティクル
- **グリッドライン:** ヒーロー背景のアニメーショングリッド
- **スクロールアニメーション:** `IntersectionObserver` でカード・フィーチャーのフェードイン
- **カウンターアニメーション:** ヒーロー統計数字のカウントアップ
- **リップルエフェクト:** ボタンクリック時

---

## 7. CVフロー（リード獲得）

### 7.1 フロー概要

```
ユーザーが車両カードのCTAをクリック
  ↓
リードキャプチャフォーム表示（モーダル）
  ↓
ユーザーが情報入力 → 「CONTINUE TO WHATSAPP」クリック
  ↓
┌─ GASにリードデータ送信（fire-and-forget, no-cors）
├─ Meta Pixel Lead イベント発火
├─ GTM dataLayer lead_enquiry イベント発火
└─ WhatsApp（+81 80-3464-8696）にリダイレクト
```

### 7.2 リードキャプチャフォーム項目

| フィールド | ID | タイプ | 必須 |
|-----------|-----|--------|------|
| YOUR NAME | `lead-name` | text | ✅ |
| COUNTRY | `lead-country` | text | ✅ |
| EMAIL | `lead-email` | email | ✅ |
| PHONE NUMBER | `lead-phone` | tel | - |
| DESIRED VEHICLE | `lead-desired-car` | text | - |
| BUDGET | `lead-budget` | select | - |
| PURCHASE TIMING | `lead-timing` | select | - |

**BUDGET選択肢:** `~ $100K` / `$100K–$200K` / `$200K–$500K` / `$500K–$1M` / `$1M+`

**TIMING選択肢:** `ASAP` / `Within 1 month` / `1–3 months` / `3–6 months` / `Just browsing`

### 7.3 GAS連携

**GAS Web App URL:**
```
https://script.google.com/macros/s/AKfycbxluaaheTfpO6Snxel3sNGo0K8XeMt5IPFgtUw-sL3eQBqtNiVOTK07n4WkNNVQcQc/exec
```

**送信データ構造:**
```json
{
  "timestamp": "2026-04-01T12:00:00.000Z",
  "name": "John Smith",
  "country": "UAE",
  "email": "john@example.com",
  "phone": "+971 50 123 4567",
  "desired_car": "Ferrari SF90",
  "budget": "$200K–$500K",
  "timing": "Within 1 month",
  "clicked_brand": "Ferrari",
  "clicked_model": "SF90 Spider",
  "clicked_year": "2022",
  "listing_url": "https://www.goo-net.com/..."
}
```

**送信方式:** `fetch()` + `mode: 'no-cors'`（fire-and-forget、WhatsApp遷移をブロックしない）

### 7.4 WhatsAppメッセージ形式

```
Hello! I found this vehicle on TCV LUXURY and I'd like to get the price and details.

🚗 Ferrari SF90 Spider
   Year: 2022
📏 Mileage: 3,000 km

👤 Name: John Smith
🌍 Country: UAE
📧 Email: john@example.com
📞 Phone: +971 50 123 4567
🚗 Desired: Ferrari SF90
💰 Budget: $200K–$500K
⏰ Timing: Within 1 month

📋 Listing: https://www.goo-net.com/...

Could you please provide the price and more details? Thank you!
```

**WhatsApp番号:** `+81 80-3464-8696`

---

## 8. トラッキング・計測タグ

### 8.1 Google Tag Manager (GTM)

| 項目 | 値 |
|------|-----|
| コンテナID | `GTM-W69PF7JH` |
| 設置場所 | `<head>` 内 (JS) + `<body>` 直後 (noscript) |

```html
<!-- head内 -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W69PF7JH');</script>

<!-- body直後 -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W69PF7JH"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

### 8.2 Google Analytics 4 (GA4)

| 項目 | 値 |
|------|-----|
| 測定ID | `G-YS81SWHQRE` |
| 設置場所 | `<head>` 内（GTMの直後） |

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YS81SWHQRE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YS81SWHQRE');
</script>
```

### 8.3 Meta Pixel (Facebook)

| 項目 | 値 |
|------|-----|
| Pixel ID | `26695493793388140` |
| 設置場所 | `<head>` 内（GA4の直後） |
| 標準イベント | `PageView`（ページ読込時）、`Lead`（WhatsApp CTA クリック時） |

```html
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '26695493793388140');
fbq('track', 'PageView');</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=26695493793388140&ev=PageView&noscript=1"/></noscript>
```

### 8.4 Vercel Analytics

| 項目 | 設置 |
|------|------|
| Speed Insights | `<script defer src="/_vercel/speed-insights/script.js"></script>` |
| Web Analytics | `<script defer src="/_vercel/insights/script.js"></script>` |

### 8.5 カスタムイベント

#### `trackLead(car)` — 全WhatsApp CTA共通

**Meta Pixel:**
```javascript
fbq('track', 'Lead', {
  content_name: 'Ferrari SF90 Spider',  // brand + model
  content_category: 'Ferrari',           // brand
  value: 0,
  currency: 'USD'
});
```

**GTM dataLayer:**
```javascript
dataLayer.push({
  event: 'lead_enquiry',
  car_brand: 'Ferrari',
  car_model: 'SF90 Spider',
  car_year: '2022'
});
```

**発火ポイント:**
1. 車両カード「GET PRICE & DETAILS」→ リードフォーム送信時
2. 車両モーダル「GET PRICE & DETAILS」→ リードフォーム送信時
3. CTAバナー「TALK TO A SPECIALIST」クリック時
4. コンタクトモーダルのWhatsAppリンクからの送信時

---

## 9. Vercel設定 (`vercel.json`)

```json
{
  "buildCommand": "node build.js",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": ".",
  "functions": {
    "api/img.js": {
      "maxDuration": 15
    }
  }
}
```

---

## 10. GAS（Google Apps Script）スクリプト

スプレッドシートに貼り付けて「ウェブアプリとしてデプロイ」する全文:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ヘッダー行がなければ作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Name', 'Country', 'Email', 'Phone',
      'Desired Vehicle', 'Budget', 'Timing',
      'Clicked Brand', 'Clicked Model', 'Clicked Year', 'Listing URL'
    ]);
  }

  sheet.appendRow([
    data.timestamp   || new Date().toISOString(),
    data.name        || '',
    data.country     || '',
    data.email       || '',
    data.phone       || '',
    data.desired_car || '',
    data.budget      || '',
    data.timing      || '',
    data.clicked_brand || '',
    data.clicked_model || '',
    data.clicked_year  || '',
    data.listing_url   || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'TCV LUXURY Lead API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**デプロイ済みURL:**
```
https://script.google.com/macros/s/AKfycbxluaaheTfpO6Snxel3sNGo0K8XeMt5IPFgtUw-sL3eQBqtNiVOTK07n4WkNNVQcQc/exec
```

---

## 11. デザインシステム

### カラーパレット

| 変数名 | ダークモード | ライトモード | 用途 |
|--------|-------------|-------------|------|
| `--gold` | `#c9a84c` | 同 | アクセント、CTA |
| `--gold-light` | `#e8c97e` | 同 | グラデーション |
| `--gold-dark` | `#8a6a20` | 同 | グラデーション |
| `--platinum` | `#e8e8e8` | `#1a1a1a` | テキスト |
| `--obsidian` | `#080808` | `#f5f2ed` | 背景 |
| `--charcoal` | `#111111` | `#ffffff` | カード背景 |
| `--carbon` | `#1a1a1a` | `#ece9e3` | サブ背景 |
| `--smoke` | `#2a2a2a` | `#dedad3` | ボーダー |
| `--muted` | `#888888` | `#777777` | 補助テキスト |

### フォント

| フォント | 用途 |
|---------|------|
| `Cinzel` (400, 600, 900) | 見出し、ブランド名、CTA |
| `Cormorant Garamond` (300, 400, italic) | サブテキスト、説明文 |
| `Noto Serif JP` (300, 400, 600) | 本文、フォーム |

---

## 12. 既知の注意事項

1. **価格非表示:** カード・モーダルとも価格は意図的に非表示。WhatsApp問い合わせに誘導するため
2. **cars.json はビルド時生成:** Vercelの再デプロイ時にのみ車両データが更新される
3. **GAS送信は `no-cors`:** レスポンスは取得できない（fire-and-forget）。送信失敗時のリトライなし
4. **画像はGooNetに依存:** GooNetのURL変更・削除時は画像表示不可になる可能性あり
5. **フォーム送信後もWhatsAppがブロックされる場合:** ブラウザのポップアップブロッカーにより `window.open` が阻止される可能性あり
