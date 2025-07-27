const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const pageUrl = req.query.page;

  if (!pageUrl) {
    return res.status(400).json({ success: false, error: "Missing 'page' query param" });
  }

  try {
    const { data } = await axios.get(pageUrl);
    const $ = cheerio.load(data);

    const script = $("script")
      .filter((_, el) => $(el).html().includes("playerInstance"))
      .html();

    const match = script.match(/file:\s*["']([^"']+)["']/);

    if (match && match[1]) {
      res.status(200).json({ success: true, video: match[1] });
    } else {
      res.status(404).json({ success: false, error: "Video URL not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
