const axios = require("axios");

module.exports = async (req, res) => {
  try {
    // Step 1: Fetch list of movie pages
    const { data: listData } = await axios.get(`${req.headers.host.startsWith("localhost") ? "http" : "https"}://${req.headers.host}/api/list`);
    const moviePages = listData.movies.slice(0, 10); // Limit to 10 for demo

    // Step 2: Fetch video URL for each
    const results = await Promise.all(
      moviePages.map(async (pageUrl) => {
        try {
          const { data: videoData } = await axios.get(`${req.headers.host.startsWith("localhost") ? "http" : "https"}://${req.headers.host}/api/fetchUrl?page=${encodeURIComponent(pageUrl)}`);
          return { pageUrl, videoUrl: videoData.video };
        } catch (e) {
          return { pageUrl, error: "Failed to fetch video" };
        }
      })
    );

    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
