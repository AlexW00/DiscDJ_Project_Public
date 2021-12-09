const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
const Config = require("../../../../config/config.js");

router.post("/", addSongToQueue);

function addSongToQueue(req, res) {
    let queueItem = req.body;
    if (queueItem == null) {
        let errorMessage = "body = " + queueItem;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    var key =
        queueItem.meta.guildID + "_" + path.basename(path.dirname(__filename));
    rLock(key, function (done) {
        redisGetQueue(key)
            .catch((error) => {
                lg.error(error);
                res.sendStatus(500);
                return;
            })
            .then((queue) => redisGetQueueInfo(queue, queueItem))
            .catch((error) => {
                lg.error(error);
                res.sendStatus(500);
                return;
            })
            .then((queueInfo) => {
                if (
                    queueInfo.alreadyQueuedItem == null &&
                    !queueInfo.queueIsFull
                ) {
                    addQueueItem(queueItem, key)
                        .then((queueSpot) => {
                            queueInfo.spot = queueSpot;
                            queueInfo.queueLength += 1;
                            queueItem.queue = queueInfo;
                            res.json(queueItem);
                            return;
                        })
                        .catch((err) => {
                            lg.error(err);
                            Promise.reject(err);
                        });
                } else {
                    if (queueInfo.queueIsFull) queueInfo.spot = -1;
                    queueItem.queue = queueInfo;
                    res.json(queueItem);
                    return;
                }
            })
            .catch((error) => {
                lg.error(error);
                res.sendStatus(500);
                return;
            });
        done();
    });
}
function addQueueItem(queueItem, key) {
    return new Promise((resolve, reject) => {
        checkIfSongIsCached(queueItem.song)
            .then(() => {
                rClient.rpush(
                    key,
                    JSON.stringify(queueItem),
                    function (err, response) {
                        if (err != null) {
                            lg.error(err);
                            reject(err);
                        } else resolve(response - 1);
                    }
                );
            })
            .catch((err) => reject(err));
    });
}

function redisGetQueueInfo(queue, queueItem) {
    return new Promise((resolve, reject) => {
        let q = {
            alreadyQueuedItem: null,
            queueIsFull: false,
            spot: 0,
            queueLength: queue.length,
        };
        queue.forEach((e) => {
            e = JSON.parse(e);
            if (e.meta.userID === queueItem.meta.userID) {
                q.alreadyQueuedItem = e;
                return;
            }
            q.spot = q.spot + 1;
        });

        if (q.spot >= Config.maxQueueSize) {
            q.queueIsFull = true;
        }
        resolve(q);
    });
}

function redisGetQueue(key) {
    return new Promise((resolve, reject) => {
        rClient.lrange(key, 0, -1, function (err, reply) {
            if (err != null) {
                lg.error(err);
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}
function checkIfSongIsCached(song) {
    const superagent = require("superagent");
    const config = require("../../../../config/config.js");
    return superagent
        .post(config.expressHost + ":3002" + "/api/commands/songs/isCached")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(song);
}
module.exports = router;
