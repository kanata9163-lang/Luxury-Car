/**
 * Vercel Serverless Function — 画像プロキシ
 * GooNet の Referer チェックを回避して画像を中継
 * URL: /api/img?url=<encoded_image_url>
 */
const axios = require('axios');

module.exports = async (req, res) => {
  const imgUrl = req.query.url;
  if (!imgUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const response = await axios.get(imgUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept':          'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer':         'https://www.goo-net.com/',
      },
    });

    const ct = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.warn('[ImgProxy] Failed:', imgUrl, err.message);
    res.status(502).send('Image fetch failed');
  }
};
