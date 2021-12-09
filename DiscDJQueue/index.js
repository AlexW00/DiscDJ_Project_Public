const Config = require("./config/config.js");
var path = require("path");
const lg = require("./logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const express = require("express");
const app = express();

app.listen(Config.expressPort, () => {
    lg.info(
        "Listening on " + Config.expressHost + " at port " + Config.expressPort
    );
});
app.use(express.json());
require("express-load-routes")(app, "./routes");

module.exports = app;
