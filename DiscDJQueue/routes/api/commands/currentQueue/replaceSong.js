const express = require("express");
const router = express.Router();
const path = require("path");
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", replaceSong);

function replaceSong(req, res) {
    let queueItem = req.body,
        index = req.query["index"],
        guildID = queueItem?.meta?.guildID;
    if (guildID == undefined || queueItem == undefined || index == undefined) {
        let errorMessage =
            "body: guildID = " +
            guildID +
            " , queueItem = " +
            queueItem +
            " , index: " +
            index;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let key = guildID + "_" + path.basename(path.dirname(__filename));
    rLock(key, function (done) {
        rClient.lset(
            key,
            index,
            JSON.stringify(queueItem),
            function (err, reply) {
                if (err != null) {
                    lg.error(err);
                    res.sendStatus(500);
                    return;
                }
                done();
            }
        );
    });
    res.sendStatus(200);
}
module.exports = router;
