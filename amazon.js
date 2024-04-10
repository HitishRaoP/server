const express = require("express");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();
const port = 8080;

const Asin = [];
function getQueryUrl(query) {
  return `https://www.amazon.in/s?k=${query}`;
}

async function getAsin(query) {
  query = query.replace(/%20/g, "+");
  const queryUrl = getQueryUrl(query);
  const { data } = await axios.get(queryUrl, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      Host: "www.amazon.in",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0",
      Pragma: "no-cache",
      TE: "Trailers",
      "Upgrade-Insecure-Requests": 1,
    },
  });
  const dom = new JSDOM(data);

  const Asin = []; // Move the Asin array declaration inside the function

  const Asins = dom.window.document.querySelectorAll("[data-asin]");

  //Pushing the data into an array
  for (let i = 0; i < Asins.length; i++) {
    const asin = Asins[i].getAttribute("data-asin");
    if (asin) {
      Asin.push({
        Asin: asin,
        Url: `https://www.amazon.in/dp/` + asin,
      });
    }
  }

  return Asin;
}


app.get("/", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const Price = await getAsin(query);
    res.json(Price);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
