const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 4000;

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from this origin
    methods: "GET,POST", // Allow only GET and POST requests
  })
);

app.use(bodyParser.json());

const scrapeFlipkart = async (query) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.flipkart.com/");
  await page.type(".Pke_EE", query);
  await page.click("._2iLD__");


  const title = await page.$$eval(
    ".s1Q9rs , ._4rR01T, .IRpwTa, .s1Q9rs",
    (nodes) => nodes.map((n) => n.innerText)
  );


  const price = await page.$$eval("._30jeq3 , _30jeq3 _1_WHN1 ", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  const review = await page.$$eval("._3LWZlK", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  const imageUrl = await page.$$eval("._396cs4", (nodes) =>
    nodes.map((n) => n.getAttribute("src"))
  );

  const totalRatingsandReviews = await page.$$eval("._2_R_DZ", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  const mrp = await page.$$eval("._3I9_wc", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  const discount = await page.$$eval("._3Ay6Sb span", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  const seller = await page.$$eval("._21Ahn-", (nodes) =>
    nodes.map((n) => n.innerText)
  );

  
  const FlipkartSearchArray = title.map((value, index) => {
    return {
      Title: title[index],
      Price: price[index],
      Mrp: mrp[index] ? mrp[index] : "N/A",
      Discount: discount[index] ? discount[index] : "N/A",
      Rating: review[index] ? review[index] + " out of 5 stars" : "N/A",
      ImageUrl: imageUrl[index] ? imageUrl[index] : "N/A",
      TotalRatingsandReviews: totalRatingsandReviews[index]
        ? totalRatingsandReviews[index]
        : "N/A",
      Seller: seller[index] ? seller[index] : "N/A",
    };
  });

  await browser.close();

  return FlipkartSearchArray;
};

app.get("/:query", async (req, res) => {
  let { query } = req.params;

  try {
    const flipkartData = await scrapeFlipkart(query);

    res.status(200).json(flipkartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Flipkart Server running at http://localhost:${port}`);
});


module.exports = app;