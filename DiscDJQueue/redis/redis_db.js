const redis = require("redis");
const rClient = redis.createClient(Config.redisPort, Config.redisHost);
var path = require("path");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

rClient.on("connect", function () {
    lg.info("connected to redis");
});
rClient.on("error", function (error) {
    lg.error(error);
});
module.exports = rClient;
