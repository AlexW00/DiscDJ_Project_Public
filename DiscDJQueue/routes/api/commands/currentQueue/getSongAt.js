const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.get("/", getSongAt);

function getSongAt(req, res) {
    let guildID = req.query["guildID"];
    let index = req.query["index"];
    if (guildID == undefined || index == undefined) {
        let errorMessage = "body: guildID = " + guildID + ", index: " + index;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let key = guildID + "_" + path.basename(path.dirname(__filename));

    rLock(key, function (done) {
        rClient.lindex(key, index, function (err, reply) {
            if (err != null) {
                lg.error(err);
                res.sendStatus(500);
            } else {
                if (reply == null) {
                    res.sendStatus(200);
                } else {
                    let queueItem = JSON.parse(reply);
                    queueItem.queue.spot = index;
                    res.json(queueItem);
                }
            }
            done();
        });
    });
}
module.exports = router;
