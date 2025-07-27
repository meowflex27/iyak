const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const moviePage = req.query.url;
  if (!moviePage) {
    return res.status(400).json({ success: false, error: "Missing 'url' query param" });
  }

  try {
    const response = await axios.get(moviePage, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://moviebox.ph",
      },
    });

    const $ = cheerio.load(response.data);

    // Look for <video> or <source> tag
    const videoSrc = $("video source").attr("src") || $("video").attr("src");

    if (!videoSrc) {
      return res.status(404).json({ success: false, error: "No video source found" });
    }

    return res.status(200).json({
      success: true,
      videoUrl: videoSrc.startsWith("http") ? videoSrc : "https://moviebox.ph" + videoSrc,
    });
  } catch (error) {
    console.error("❌ Scrape Video Error:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch video URL" });
  }
};
