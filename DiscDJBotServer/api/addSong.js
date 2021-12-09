const superagent = require("superagent");
var path = require("path");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
const QueueItem = require("../objects/QueueItem.js");
const ObjectFlattener = require("../utils/ObjectFlattener.js");
module.exports = addSong = (queueItem) => {
    return new Promise((resolve, reject) => {
        superagent
            .post("http://127.0.0.1:3000/api/commands/currentQueue/addSong")
            .send(JSON.stringify(queueItem))
            .set("Content-Type", "application/json; charset=utf-8")
            .redirects(0)
            .then((response) => {
                lg.info("add song dc");
                lg.info(response.body);
                let r =
                    response.body == null || response.body == ""
                        ? {}
                        : new QueueItem(ObjectFlattener(response.body));
                resolve(r);
            })
            .catch((err) => {
                lg.error(err);
                reject(err);
            });
    });
};
