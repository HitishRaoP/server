const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies

async function getChannelDetails(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        Host: "www.youtube.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0",
        Pragma: "no-cache",
        TE: "Trailers",
        "Upgrade-Insecure-Requests": 1,
      },
    });

    const $ = cheerio.load(data);
    const title = $("meta[property='og:title']").attr("content").trim();
    const description = $("meta[property='og:description']")
      .attr("content")
      .trim()
      .replace(/\n/g, '');
    return (Details = 
      { 
      Title: title, 
      Description: description
     });
  } catch (error) {
    console.error("Error fetching channel details:", error);
    return null;
  }
}

// Example usage
getChannelDetails("https://www.youtube.com/channel/UCFbNIlppjAuEX4znoulh0Cw")
  .then((details) => {
    if (details) {
      console.log(Details);
    } else {
      console.log("No channel details found.");
    }
  })
  .catch((error) => {
    console.error("Error in getChannelDetails:", error);
  });

module.exports = app;
