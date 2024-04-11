const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const ObjectsToCsv = require("objects-to-csv");
const XLSX = require("xlsx");

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies

function getQueryUrl(query) {
  const queryUrlBase = `https://www.amazon.in/s?k=${query}&tag=hitish04-21`;
  return queryUrlBase;
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

async function saveAsinData(format, data) {
  switch (format) {
    case "csv":
      const csv = new ObjectsToCsv(data);
      const formattedData = await csv.toString();
      const fileNameCsv = `data.${format}`;
      fs.writeFileSync(fileNameCsv, formattedData);
      return fileNameCsv;
    case "xlsx":
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      const fileNameXlsx = `data.${format}`;
      fs.writeFileSync(fileNameXlsx, xlsxBuffer);
      return fileNameXlsx;
    case "json":
      const formattedJson = JSON.stringify(data, null, 2);
      const fileNameJson = `data.${format}`;
      fs.writeFileSync(fileNameJson, formattedJson);
      return fileNameJson;
    default:
      throw new Error("Invalid format");
  }
}

app.get("/", async (req, res) => {
  const query = req.query.q;
  const format = req.query.format;
  const outputFields = req.query.fields?.split(",") || [];

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const asins = await getAsin(query);

    let outputData = asins;

    if (outputFields.length > 0) {
      outputData = asins.map(asin => {
        const filteredAsin = {};
        outputFields.forEach(field => {
          if (asin[field]) {
            filteredAsin[field] = asin[field];
          }
        });
        return filteredAsin;
      });
    }

    if (!format) {
      return res.json(outputData);
    }

    const fileName = await saveAsinData(format, outputData);

    // Return the file as a download
    res.download(fileName, () => {
      // Delete the file after download
      fs.unlinkSync(fileName);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export the Express app
module.exports = app;