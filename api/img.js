/**
 * Vercel Serverless Function — Image Proxy
 * Bypasses GooNet Referer check + auto-upgrades to high-res
 * URL: /api/img?url=<encoded_image_url>
 */
const axios = require('axios');

module.exports = async (req, res) => {
  let imgUrl = req.query.url;
  if (!imgUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  // Auto-upgrade GooNet thumbnail → large image
  if (imgUrl.includes('/J/')) {
    imgUrl = imgUrl.replace('/J/', '/L/');
  }

  const headers = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept':          'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer':         'https://www.goo-net.com/',
  };

  try {
    // Try large image first
    const response = await axios.get(imgUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers,
      validateStatus: s => s === 200,
    });

    const ct = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(Buffer.from(response.data));
  } catch (err) {
    // Fallback: if /L/ fails, try original /J/ URL
    if (imgUrl.includes('/L/')) {
      try {
        const fallbackUrl = imgUrl.replace('/L/', '/J/');
        const resp2 = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers,
        });
        const ct = resp2.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.send(Buffer.from(resp2.data));
        return;
      } catch (e) { /* fall through */ }
    }
    console.warn('[ImgProxy] Failed:', imgUrl, err.message);
    res.status(502).send('Image fetch failed');
  }
};
