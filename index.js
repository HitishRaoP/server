const express = require("express");
const cors = require("cors");
const amazonApp = require("./amazon");
const flipkartApp = require("./flipkart");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // Parse JSON bodies

app.use("/amazon", amazonApp);
app.use("/flipkart", flipkartApp);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  // another common pattern
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

const handler = (req, res) => {
  const d = new Date();
  res.end(d.toString());
};

module.exports = allowCors(handler);
module.exports = app;
