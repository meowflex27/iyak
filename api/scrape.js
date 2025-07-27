const axios = require("axios");

module.exports = async (req, res) => {
  const videoUrl = req.query.video;
  const jsonUrl = req.query.url;
  const target = videoUrl || jsonUrl;

  if (!target) {
    return res.status(400).json({
      success: false,
      error: "Missing 'video' or 'url' query param"
    });
  }

  try {
    const response = await axios.get(target, {
      responseType: videoUrl ? "stream" : "json",
      headers: {
        Referer: "https://moviebox.ph",
        Origin: "https://moviebox.ph",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        Range: req.headers.range || "bytes=0-"
      },
      validateStatus: (status) => status < 500 // Allow 403, 404 to be processed
    });

    if (response.status >= 400) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream returned ${response.status}`
      });
    }

    if (videoUrl) {
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");
      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", response.headers["content-range"]);
      }
      response.data.pipe(res);
    } else {
      res.status(200).json({ success: true, data: response.data });
    }

  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch from target"
    });
  }
};
