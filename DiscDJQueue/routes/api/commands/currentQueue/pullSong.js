const express = require("express");
const router = express.Router();
const path = require("path");
const rClient = require("../../../../redis/redis_db.js");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.get("/", pullSong);

function pullSong(req, res) {
    const rLock = require("../../../../redis/rLock");
    let guildID = req.query["guildID"];
    if (guildID == undefined) {
        let errorMessage = "body: guildID = " + guildID;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let key = guildID + "_" + path.basename(path.dirname(__filename));

    rLock(key, function (done) {
        redisPullSong(key)
            .then((queueItem) => {
                if (queueItem == null) res.sendStatus(200);
                else {
                    const addSongToOldQueue =
                        require("../oldQueue/addSong.js").addSong;
                    addSongToOldQueue(queueItem)
                        .then(res.json(queueItem))
                        .catch((err) => {
                            lg.info(err);
                            res.sendStatus(500);
                        });
                }
            })
            .catch((err) => {
                lg.error(err);
                res.sendStatus(500);
            });
        done();
    });
}

function redisPullSong(key) {
    return new Promise((resolve, reject) => {
        rClient.lpop(key, function (err, reply) {
            if (err != null) {
                reject(err);
            }
            let queueItem = reply;
            try {
                if (queueItem != null) {
                    queueItem = JSON.parse(queueItem);
                    queueItem.queue.spot = 0;
                }
            } catch (err) {
                reject(err);
            }
            resolve(queueItem);
        });
    });
}
module.exports = router;
