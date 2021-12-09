const express = require("express");
const router = express.Router();
const superagent = require("superagent");
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", addSongReq);
function addSongReq(req, res) {
    let queueItem = req.body;
    addSong(queueItem)
        .then(res.sendStatus(200))
        .catch((err) => {
            res.sendStatus(500);
            lg.error(err);
        });
}
function addSong(queueItem) {
    return new Promise((resolve, reject) => {
        if (queueItem == undefined) {
            let errorMessage = "body: " + "queueItem: " + queueItem;
            lg.error(errorMessage);
            reject(errorMessage);
            return;
        }
        let queueItemString = JSON.stringify(queueItem),
            guildID = queueItem.meta.guildID;
        key = guildID + "_" + path.basename(path.dirname(__filename));

        rLock(key, function (done) {
            rClient.lpush(key, queueItemString, function (err, reply) {
                getLastPlayedQueueItem(key)
                    .then((queueItem) => distributeScores(queueItem))
                    .then((reply) => trimIfNecessairy(reply, key))
                    .catch((err) => {
                        lg.error(err);
                        reject(err);
                    });
                done();
                resolve();
            });
        });
    });
}

function trimIfNecessairy(reply, key) {
    return new Promise((resolve, reject) => {
        let length = reply;
        //if (true) {
        if (length >= 10) {
            rClient.lrange(key, 5, -1, function (err, reply) {
                if (err != null) reject(err);
                if (reply != null && !Array.isArray(reply)) reply = [reply];
                if (reply != null) {
                    superagent
                        .post(
                            "127.0.0.1:3010/api/commands/history/addSongsToDB"
                        )
                        .send(reply) // sends a JSON post body
                        .set("accept", "json")
                        .end((err, res) => {});
                    rClient.ltrim(key, 0, 4);
                    resolve();
                }
            });
        }
    });
}
// index is 1 because other song has been pushed
function getLastPlayedQueueItem(key) {
    return new Promise((resolve, reject) => {
        rClient.lindex(key, 1, function (err, reply) {
            if (err != null) reject(err);
            let lastQueueItem = JSON.parse(reply);
            lastQueueItem.queue.spot = -1;
            lastQueueItem.queue.queuLength = -1;
            resolve(JSON.parse(reply));
        });
    });
}

// TODO: dont execute if empty spot
function distributeScores(queueItem) {
    return superagent
        .post("http://127.0.0.1:3004/api/commands/scores/distributeScores")
        .send(queueItem)
        .set("Content-Type", "application/json; charset=utf-8")
        .redirects(0);
}
module.exports = router;
module.exports.addSong = addSong;
