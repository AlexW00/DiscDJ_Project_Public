const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.get("/", get);

function get(req, res) {
    let guildID = req.query["guildID"];
    if (guildID == undefined) {
        let errorMessage = "body: guildID = " + guildID;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    getGuildLeaderboard(guildID)
        .then((guildLeaderboard) => {
            res.send(guildLeaderboard);
        })
        .catch((err) => {
            lg.error(err);
            res.append("error", err);
            res.sendStatus(500);
        });
}
function getGuildLeaderboard(guildID) {
    return new Promise((resolve, reject) => {
        let dateObj = new Date();
        let date =
            ("0" + dateObj.getDate()).slice(-2) +
            "-" +
            ("0" + (dateObj.getMonth() + 1)).slice(-2) +
            "-" +
            dateObj.getFullYear();
        let key = guildID + "_" + "scores_" + date;
        rLock(key, function (done) {
            rClient.zrevrange(key, 0, 9, function (err, reply) {
                if (err != null) {
                    reject(err);
                } else {
                    getScoresForUsers(reply, key).then((lb) => {
                        done();
                        resolve(lb);
                    });
                }
            });
        });
    });
}

function getScoresForUsers(userIDs, key) {
    return new Promise((resolve, reject) => {
        let lb = userIDs.map((e) => {
            return new Promise((resolve, reject) => {
                rClient.zscore(key, e, function (err, reply) {
                    if (err != null) {
                        lg.error(err);
                        reject(err);
                    }
                    resolve({
                        userID: e,
                        score: reply,
                    });
                });
            });
        });
        Promise.all(lb)
            .then((guildLeaderboard) => resolve(guildLeaderboard))
            .catch((err) => {
                lg.error(err);
                reject(err);
            });
    });
}

module.exports = router;
module.exports.getGuildLeaderboard = getGuildLeaderboard;
