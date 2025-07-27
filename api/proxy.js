const axios = require("axios");

module.exports = async (req, res) => {
  const videoUrl = req.query.video;

  if (!videoUrl) {
    return res.status(400).json({ success: false, error: "Missing 'video' query param" });
  }

  try {
    const headers = {
      Referer: videoUrl,
      Origin: "https://moviebox.ph",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "*/*",
      Connection: "keep-alive",
    };

    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const response = await axios.get(videoUrl, {
      responseType: "stream",
      headers,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      return res
        .status(response.status)
        .json({ success: false, error: `Upstream returned ${response.status}` });
    }

    res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }
    if (response.headers["content-range"]) {
      res.setHeader("Content-Range", response.headers["content-range"]);
      res.status(206);
    } else {
      res.status(200);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch video" });
  }
};
