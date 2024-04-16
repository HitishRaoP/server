const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies

function getQueryUrl(query, page) {
  const queryUrlBase = `https://www.flipkart.com/search?q=${query}`;
  return queryUrlBase;
}

async function getProducts(query, page, fields) {
  const queryUrl = getQueryUrl(query, page);

  const response = await axios.get(queryUrl,{
    Accept : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    Host : "www.amazon.in",
    "User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    Pragma : "no-cache",
    "Upgrade-Insecure-Requests" : 1,
    TE : "Trailers"
  });
  const $ = cheerio.load(response.data);

  const products = [];
  const totalPagesElement = $('._2MImiq').last();
  const totalPages = totalPagesElement.text().trim() || 'N/A';

  $('.s-result-item').each((index, el) => {
    const asin = $(el).attr('data-asin');
    const titleElement = $(el).find('h2 a');
    const priceElement = $(el).find('._30jeq3');
    const peopleBoughtElement = $(el).find('._2_R_DZ');
    const imageElement = $(el).find('._396cs4');
    const ratingsElement = $(el).find('._1lRcqv span');
    const mrpElement = $(el).find('._3I9_wc');
    const offElement = $(el).find('._8VNy32');
    const reviewRatingElement = $(el).find('._4ri7C0');

    if (asin && titleElement && priceElement && peopleBoughtElement && imageElement && ratingsElement && reviewRatingElement) {
      const title = titleElement.text().trim();
      const price = priceElement.text().trim();
      const peopleBought = peopleBoughtElement.text().trim();
      const imageUrl = imageElement.attr('src');
      const ratings = ratingsElement.text().trim();
      const mrp = mrpElement.text().trim() || 'N/A';
      const offer = offElement.text().trim() || 'N/A';
      const reviewRating = reviewRatingElement.text().trim();

      let fieldsObj = {
        Source: 'Flipkart',
        ASIN: asin,
        Title: title,
        Price: price,
        "Product URL": `https://www.flipkart.com/dp/${asin}`,
        'People Bought In Last Month': peopleBought,
        "Image URL": imageUrl,
        Review: ratings,
        MRP: mrp,
        Off: offer,
        Rating: reviewRating,
        "Total Pages": totalPages
      };

      if (fields && fields !== 'full') {
        const selectedFields = fields.split(',').map(field => field.trim());
        fieldsObj = Object.fromEntries(
          Object.entries(fieldsObj).filter(([key, value]) => selectedFields.includes(key))
        );
      }

      products.push(fieldsObj);
    }
  });

  return products;
}

app.get("/", async (req, res) => {
  const query = req.query.q;
  const page = req.query.page || 1; // Default to page 1 if not provided
  const fields = req.query.fields || 'full'; // Default to full fields if not provided

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const products = await getProducts(query, page, fields);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export the Express app
module.exports = app;
