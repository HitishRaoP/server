const express = require("express");
const amazonApp = require("./amazon");

const app = express();
const port = process.env.PORT || 3000;

app.use("/amazon", amazonApp);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;