const express = require("express");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();
const port = 8080;

function getQueryUrl(query) {
  return `https://www.amazon.in/s?k=${query}`;
}

async function getPrice(query) {
  const ProductDetails = [];
  query = query.replace(" ", "+");
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

  //Getting the price
  const prices = dom.window.document.querySelectorAll(".a-price-whole");

  //Getting the title
  const titles = dom.window.document.querySelectorAll(
    ".a-color-base.a-text-normal"
  );

  const Mrp = dom.window.document.querySelectorAll(".a-text-price span");

  // Combine prices and titles into ProductDetails array
  for (let i = 0; i < Math.min(prices.length, titles.length); i++) {
    ProductDetails.push({
      Title: titles[i].textContent.trim(),
      Price: prices[i].textContent.trim(),
      Mrp: Mrp[i].textContent.trim(),
    });
  }

  return ProductDetails;
}

app.get("/", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const Price = await getPrice(query);
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