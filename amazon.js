const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies

async function getAsin(query, page) {
  query = query.replace(/%20/g, "+");
  const queryUrl = getQueryUrl(query, page); // Pass the page parameter to getQueryUrl
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

  const products = [];

  const productElements =
    dom.window.document.querySelectorAll(".s-result-item");

  productElements.forEach((element) => {
    const asin = element.getAttribute("data-asin");
    const titleElement = element.querySelector(".a-text-normal");
    const priceElement = element.querySelector(".a-price-whole");
    const imageElement = element.querySelector(".s-image");
    const mrpElement = element.querySelector(
      ".aok-inline-block .a-text-price span"
    );
    const peopleBoughtElement = element.querySelector(
      ".s-title-instructions-style+ .a-spacing-top-micro .a-color-secondary"
    );
    const deliveryDateElement = element.querySelector(
      ".a-row+ .a-row .a-text-bold"
    );
    const offerElement = element.querySelector(".a-letter-space+ span");
    const ratingsElement = element.querySelector(
      ".s-link-style .s-underline-text"
    );
    const reviewRatingElement = element.querySelector(".aok-align-bottom");

    if (asin && titleElement && priceElement && imageElement) {
      const title = titleElement.textContent.trim();
      const price = priceElement.textContent.trim();
      const imageUrl = imageElement.getAttribute("src");
      const mrp = mrpElement ? mrpElement.textContent.trim() : "N/A";
      const peopleBought = peopleBoughtElement
        ? peopleBoughtElement.textContent.trim()
        : "N/A";
      const deliveryDate = deliveryDateElement
        ? "Fastest Delivery by " + deliveryDateElement.textContent.trim()
        : "N/A";
      const offer = offerElement ? offerElement.textContent.trim() : "N/A";
      const ratings = ratingsElement
        ? ratingsElement.textContent.trim()
        : "N/A";
      const review = reviewRatingElement
        ? reviewRatingElement.textContent.trim()
        : "N/A";

      products.push({
        Source: "Amazon",
        ASIN: asin,
        "Product URL": `https://www.amazon.in/dp/` + asin,
        Title: title,
        Price: price,
        "Image URL": imageUrl,
        MRP: mrp,
        "People Bought In Last Month": peopleBought,
        "Delivery Date": deliveryDate,
        Offer: offer,
        Ratings: ratings,
        Review: review,
      });
    }
  });

  const totalPagesElement = dom.window.document.querySelector(
    ".s-pagination-ellipsis+ .s-pagination-disabled"
  );
  const totalPages = totalPagesElement
    ? totalPagesElement.textContent.trim()
    : "N/A";

  return { "Total Pages": totalPages, products };
}

function getQueryUrl(query, page) {
  const queryUrlBase = `https://www.amazon.in/s?k=${query}&page=${page}`;
  return queryUrlBase;
}

app.get("/", async (req, res) => {
  const query = req.query.q;
  const outputFields = req.query.fields?.split(",") || [];
  const page = parseInt(req.query.page) || 1; // Parse the page parameter

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const asins = await getAsin(query, page); // Pass the page parameter to getAsin
    const totalPages = parseInt(asins["Total Pages"]) || 1;

    if (page > totalPages) {
      return res.status(404).json({ error: "Page does not exist" });
    }

    let outputData = asins;

    if (outputFields.length > 0) {
      outputData = asins.products.map((asin) => {
        const filteredAsin = {};
        outputFields.forEach((field) => {
          if (asin[field]) {
            filteredAsin[field] = asin[field];
          }
        });
        return filteredAsin;
      });
    }

    res.json(outputData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = app;
