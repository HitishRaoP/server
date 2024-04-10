const express = require("express");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const ObjectsToCsv = require('objects-to-csv');
const cors = require("cors");

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json()); // Parse JSON bodies

const queryUrlBase = "https://www.amazon.in/s?k=";
function getQueryUrl(query) {
  return queryUrlBase + encodeURIComponent(query);
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

  const Asin = [];

  const Asins = dom.window.document.querySelectorAll("[data-asin]");

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
    const asins = await getAsin(query);
    res.json(asins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/save-csv", async (req, res) => {
  try {
    const data = req.body;
    const csv = new ObjectsToCsv(data);
    await csv.toDisk("./data.csv");
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/save-excel", async (req, res) => {
  try {
    const data = req.body;
    const csv = new ObjectsToCsv(data);
    await csv.toDisk("./data.xls");
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/save-json", async (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;