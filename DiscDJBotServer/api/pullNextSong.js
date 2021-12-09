const superagent = require("superagent");
const QueueItem = require("../objects/QueueItem");
const path = require("path");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
const ObjectFlattener = require("../utils/ObjectFlattener");
module.exports = pullNextSong = (guildID) => {
    return new Promise((resolve, reject) => {
        superagent
            .get("http://127.0.0.1:3000/api/commands/currentQueue/pullSong")
            .query({ guildID: guildID })
            .redirects(0)
            .then((response) => {
                // create QueuItem object from JSON response and resolve
                resolve(
                    response.body.song == null
                        ? null
                        : new QueueItem(ObjectFlattener(response.body))
                );
            })
            .catch((error) => {
                lg.error(error);
                reject(error);
            });
    });
};
