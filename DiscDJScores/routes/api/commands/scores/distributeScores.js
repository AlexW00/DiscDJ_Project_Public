const express = require("express");
const router = express.Router();
const Config = require("../../../../config/config.js");
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", distribute);

async function distribute(req, res) {
    if (req.body == undefined || req.body.meta == undefined) {
        let errorMessage = "body: queueItem = " + req.body;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let guildID = req.body.meta.guildID,
        djID = req.body.meta.userID,
        interactions = req.body.interactions,
        heardBy = (await getHeardBy(guildID)) ?? [],
        dateObj = new Date(),
        date =
            ("0" + dateObj.getDate()).slice(-2) +
            "-" +
            ("0" + (dateObj.getMonth() + 1)).slice(-2) +
            "-" +
            dateObj.getFullYear(),
        localScoreKey =
            guildID +
            "_" +
            path.basename(path.dirname(__filename) + "_" + date),
        globalScoreKey = "global_scores_" + date;

    if (!interactions.skipped) {
        let djScore = calculateDjScore(interactions, heardBy);

        distributeGlobalScores(globalScoreKey, djID, djScore, heardBy)
            .then(() =>
                distributeLocalScores(localScoreKey, djID, djScore, heardBy)
            )
            .then(() =>
                sendScoresToDB(
                    guildID,
                    djID,
                    heardBy,
                    Config.listenerScore,
                    djScore
                )
            )
            .then(() => {
                res.append("skipped", false);
                res.sendStatus(200);
            })
            .catch((err) => {
                lg.error(err);
                res.sendStatus(500);
            });
    } else {
        res.append("skipped", true);
        res.sendStatus(200);
    }
}

function distributeLocalScores(localScoreKey, djID, djScore, heardBy) {
    return new Promise(function (resolve, reject) {
        rLock(localScoreKey, function (done) {
            heardBy.forEach((userID) => {
                try {
                    rClient.zincrby(
                        localScoreKey,
                        Config.listenerScore,
                        userID
                    );
                } catch (err) {
                    lg.error(err);
                    reject(err);
                }
            });
            try {
                rClient.zincrby(localScoreKey, djScore, djID);
            } catch {
                lg.error(err);
                reject(err);
            }
            done();
            resolve();
        });
    });
}
function distributeGlobalScores(globalScoreKey, djID, djScore, heardBy) {
    return new Promise(function (resolve, reject) {
        rLock(globalScoreKey, function (done) {
            lg.info(heardBy);
            heardBy.forEach((userID) => {
                try {
                    rClient.zincrby(
                        globalScoreKey,
                        Config.listenerScore,
                        userID
                    );
                } catch (err) {
                    lg.error(err);
                    reject(err);
                }
            });
            try {
                rClient.zincrby(globalScoreKey, djScore, djID);
            } catch (err) {
                lg.error(err);
                reject(err);
            }
            done();
            resolve();
        });
    });
}

function calculateDjScore(interactions, heardBy) {
    let extraScoreListeners =
            heardBy.length * Config.scorePerListener * Config.listenerWeight,
        extraScoreInteractions =
            (interactions.likes.length * Config.likeScore +
                interactions.saves.length * Config.saveScore -
                interactions.dislikes.length * Config.dislikeScore) *
            Config.interactionsWeight,
        extraScore = extraScoreListeners + extraScoreInteractions,
        djScore = Math.min(Math.max(extraScore, 0), Config.maxScore);

    return djScore;
}
function sendScoresToDB(guildID, djID, heardBy, listenerScore, djScore) {
    const superagent = require("superagent");
    config = require("../../../../config/config.js");
    let scoreInfo = {
        guildID: guildID,
        djID: djID,
        heardBy: heardBy,
        listenerScore: listenerScore,
        djScore: djScore,
    };
    return superagent
        .post(
            config.expressHost + ":3010" + "/api/commands/scores/updateScores"
        )
        .set("Content-Type", "application/json; charset=utf-8")
        .send(scoreInfo);
}
function getHeardBy(guildID) {
    return new Promise(function (resolve, reject) {
        const superagent = require("superagent");
        superagent
            .post("http://127.0.0.1:3001/api/commands/users/getUsers")
            .set("Content-Type", "application/json; charset=utf-8")
            .query({ guildID: guildID })
            .end(function (err, res) {
                if (err || !res.ok) {
                    reject([]);
                } else {
                    resolve(res.body);
                }
            });
    });
}
module.exports = router;
