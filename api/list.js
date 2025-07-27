const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://moviebox.ph";

module.exports = async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE}/web/film`);
    const $ = cheerio.load(data);
    const movieLinks = [];

    $(".film_list-wrap a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/movies/")) {
        movieLinks.push(`${BASE}${href}`);
      }
    });

    res.status(200).json({ success: true, movies: movieLinks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
