const express = require("express");
const { router } = require("./routes/index");

const app = express();
app.use(express.json());
app.use("/api", router);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, "127.0.0.1", () => console.log(JSON.stringify({ status: "prototype-api-ready", port })));
}

module.exports = { app };
