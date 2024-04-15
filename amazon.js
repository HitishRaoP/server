const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies

function getQueryUrl(query, page) {
  const queryUrlBase = `https://www.amazon.in/s?k=${query}&page=${page}&tag=hitish04-21`;
  return queryUrlBase;
}


async function getProducts(query, page, fields) {
  const queryUrl = getQueryUrl(query, page);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const pageObj = await context.newPage(); // Changed variable name to pageObj

  await pageObj.goto(queryUrl);

  const products = [];

  const productElements = await pageObj.$$('.s-result-item');
  const totalPagesElement = await pageObj.$('.s-pagination-ellipsis+ .s-pagination-disabled');
  const totalPages = totalPagesElement ? await (await totalPagesElement.getProperty('textContent')).jsonValue() : 'N/A';

  const promises = productElements.map(async (el) => {
    const asin = await el.getAttribute('data-asin');
    const titleElement = await el.$('h2 a');
    const priceElement = await el.$('.a-price .a-offscreen');
    const peopleBoughtElement = await el.$('.s-title-instructions-style+ .a-spacing-top-micro .a-color-secondary');
    const imageElement = await el.$('.s-image');
    const ratingsElement = await el.$('.a-size-small .a-link-normal span');
    const mrpElement = await el.$('.aok-inline-block .a-text-price span');
    const offElement = await el.$('.a-letter-space+ span');
    const reviewRatingElement = await el.$('.aok-align-bottom');
    const deliveryDateElement = await el.$('.a-row+ .a-row .a-text-bold');

    if (asin && titleElement && priceElement && peopleBoughtElement && imageElement && ratingsElement && reviewRatingElement) {
      const title = await (await titleElement.getProperty('textContent')).jsonValue();
      const price = await (await priceElement.getProperty('textContent')).jsonValue();
      const peopleBought = await (await peopleBoughtElement.getProperty('textContent')).jsonValue();
      const imageUrl = await imageElement.getAttribute('src');
      const ratings = await (await ratingsElement.getProperty('textContent')).jsonValue();
      const mrp = mrpElement ? await (await mrpElement.getProperty('textContent')).jsonValue() : 'N/A';
      const offer = offElement ? await (await offElement.getProperty('textContent')).jsonValue() : 'N/A';
      const reviewRating = await (await reviewRatingElement.getProperty('textContent')).jsonValue();
      const deliveryDate = deliveryDateElement ? await (await deliveryDateElement.getProperty('textContent')).jsonValue() : 'N/A';

      let fieldsObj = {
        Source: 'Amazon',
        ASIN: asin,
        Title: title,
        Price: price,
        "Product URL": `https://www.amazon.in/dp/${asin}`,
        'People Bought In Last Month': peopleBought,
        "Image URL": imageUrl,
        Review: ratings,
        MRP: mrp,
        Off: offer,
        Rating: reviewRating,
        "Delivery Date": "Fastest Delivery by " + deliveryDate,
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

  await Promise.all(promises);

  await browser.close();

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
