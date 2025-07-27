// /api/movie.js
const axios = require('axios');
const { extractSubjectId, extractDetailPathFromHtml } = require('./_utils');

const TMDB_API_KEY = 'ea97a714a43a0e3481592c37d2c7178a';

module.exports = async (req, res) => {
  const tmdbId = req.query.tmdbId;

  if (!tmdbId) {
    return res.status(400).json({ error: 'Missing tmdbId param' });
  }

  try {
    const tmdbResp = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const title = tmdbResp.data.title;
    const year = tmdbResp.data.release_date?.split('-')[0];

    const searchUrl = `https://moviebox.ph/web/searchResult?keyword=${encodeURIComponent(`${title} ${year}`)}`;
    const html = (await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).data;

    const subjectId = extractSubjectId(html, title);
    if (!subjectId) return res.status(404).json({ error: 'Subject ID not found' });

    const detailPath = extractDetailPathFromHtml(html, subjectId, title);
    const detailsUrl = detailPath ? `https://moviebox.ph/movies/${detailPath}?id=${subjectId}` : null;

    const downloadUrl = `https://moviebox.ph/wefeed-h5-bff/web/subject/download?subjectId=${subjectId}&se=0&ep=0`;

    const downloadResp = await axios.get(downloadUrl, {
      headers: {
        referer: detailsUrl,
        'user-agent': 'Mozilla/5.0',
        'x-client-info': JSON.stringify({ timezone: 'Africa/Lagos' }),
        'x-source': 'h5',
        cookie: 'i18n_lang=en'
      }
    });

    res.json({
      title,
      year,
      subjectId,
      detailPath: detailPath || '❌ Not found',
      detailsUrl: detailsUrl || '❌ Not available',
      downloadData: downloadResp.data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
