const axios = require('axios');
const { extractSubjectId, extractDetailPathFromHtml } = require('./_utils');

const TMDB_API_KEY = 'ea97a714a43a0e3481592c37d2c7178a';

exports.handler = async function(event) {
  const { tmdbId, season, episode } = event.queryStringParameters;

  if (!tmdbId || !season || !episode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing tmdbId, season, or episode' })
    };
  }

  try {
    const tmdbResp = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const title = tmdbResp.data.name;
    const year = tmdbResp.data.first_air_date?.split('-')[0];

    const searchUrl = `https://moviebox.ph/web/searchResult?keyword=${encodeURIComponent(`${title} ${year}`)}`;
    const html = (await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).data;

    const subjectId = extractSubjectId(html, title);
    if (!subjectId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Subject ID not found' })
      };
    }

    const detailPath = extractDetailPathFromHtml(html, subjectId, title);
    const detailsUrl = detailPath ? `https://moviebox.ph/movies/${detailPath}?id=${subjectId}` : null;

    const downloadUrl = `https://moviebox.ph/wefeed-h5-bff/web/subject/download?subjectId=${subjectId}&se=${season}&ep=${episode}`;

    const downloadResp = await axios.get(downloadUrl, {
      headers: {
        referer: detailsUrl,
        'user-agent': 'Mozilla/5.0',
        'x-client-info': JSON.stringify({ timezone: 'Africa/Lagos' }),
        'x-source': 'h5',
        cookie: 'i18n_lang=en'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        year,
        subjectId,
        detailPath: detailPath || '❌ Not found',
        detailsUrl: detailsUrl || '❌ Not available',
        downloadData: downloadResp.data
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
