const express = require("express");
const amazonApp = require("./source/amazon");
const flipkartApp = require("./source/flipkart");

const app = express();
const port = process.env.PORT || 3000;

app.use("/amazon", amazonApp);
app.use("/flipkart", flipkartApp);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;