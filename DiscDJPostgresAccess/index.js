const Config = require("./config/config.js");

const express = require("express");
const app = express();
app.listen(Config.expressPort, () =>
  console.log(
    "Listening on " + Config.expressHost + " at port " + Config.expressPort
  )
);

app.use(express.json());
require("express-load-routes")(app, "./routes");

module.exports = app;
