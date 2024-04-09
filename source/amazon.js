const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 8080;

app.use(cors({
  origin: 'http://localhost:3000', 
  methods: 'GET,POST',
}));

app.use(bodyParser.json());

const scrapeAmazon = async (query) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.amazon.in");
  await page.type("#twotabsearchtextbox", query);
  await page.click("#nav-search-submit-button");
  await page.waitForSelector(".s-pagination-next");

  // Gather product title
  const title = await page.$$eval(".a-color-base.a-text-normal", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  // Gather price
  const price = await page.$$eval(
    ".a-price-whole",
    (nodes) => nodes.map((n) => n.innerText)
  );

  // Gather review
  const review = await page.$$eval(".aok-align-bottom", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  // Gather image URL
  const imageUrl = await page.$$eval(".puis-flex-expand-height , .s-image", (nodes) =>
    nodes.map((n) => n.getAttribute("src"))
  );

  // Consolidate product search data
  const amazonSearchArray = title.slice(0, 50).map((value, index) => {
    return {
      Title: title[index],
      Price: price[index],
      Rating: review[index],
      ImageUrl: imageUrl[index],
    };
  });

  await browser.close();
  return amazonSearchArray;
};

app.get("/:query", async (req, res) => {
  let { query } = req.params;
  query = query.replace(/\s+/g, "+");
  try {
    const amazonData = await scrapeAmazon(query);

    res.status(200).json(amazonData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Amazon Server running at http://localhost:${port}`);
});


module.exports = app;