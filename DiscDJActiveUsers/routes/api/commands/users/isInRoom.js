const express = require("express");
const router = express.Router();
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const rClient = require("../../../../redis/redis_db.js");
router.post("/", checkRoom);

function checkRoom(req, res) {
    let userID = req.query["userID"];
    let guildID = req.query["guildID"];

    if (guildID == undefined || userID == undefined) {
        let errorMessage =
            "invalid parameters: " +
            "guildID: " +
            guildID +
            "; userID: " +
            userID;
        res.append("reason", errorMessage);
        res.sendStatus(422);
        lg.error(errorMessage);
        return;
    }

    let key = guildID + "_" + path.basename(path.dirname(__filename));

    rLock(key, function (done) {
        checkIfIsInRedisList(key, userID)
            .then((isMember) => {
                done();
                res.append("isInRoom", isMember);
                res.sendStatus(200);
            })
            .catch((error) => {
                done();
                lg.error(error);
                res.sendStatus(500);
            });
    });
}

function checkIfIsInRedisList(key, userID) {
    return new Promise((resolve, reject) => {
        rClient.sismember(key, userID, function (err, reply) {
            if (err != null) reject(err);
            else if (reply != 1) {
                addUserToDB(userID, key)
                    .then(
                        () =>
                            addToRedisList(key, userID).then(
                                () => resolve(true),
                                (err) => reject(err)
                            ),
                        (err) => reject(err)
                    )
                    .catch((error) => reject(error));
            } else {
                lg.info(key + " " + userID);
                lg.info(reply);
                resolve(true);
            }
        });
    });
}

function addToRedisList(key, userID) {
    lg.info("adding to redis");
    return new Promise((resolve, reject) => {
        rClient.sadd(key, userID, function (err, reply) {
            if (err != null) reject(err);
            resolve(false);
        });
    });
}

function addUserToDB(userID, key) {
    return new Promise((resolve, reject) => {
        const config = require("../../../../config/config.js");
        const superagent = require("superagent");
        superagent
            .post(
                config.expressHost +
                    ":3010" +
                    "/api/commands/users/addNewUserToDB"
            )
            .set("Content-Type", "application/json; charset=utf-8")
            .query("userID=" + userID)
            .then((res) => {
                if (res.statusCode != 200) {
                    lg.error("Failed to add to DB, retrying");
                    superagent
                        .post(
                            config.expressHost +
                                ":3010" +
                                "/api/commands/users/addNewUserToDB"
                        )
                        .set("Content-Type", "application/json; charset=utf-8")
                        .query("userID=" + userID)
                        .then((res) => {
                            lg.info("code: " + res.statusCode);
                            if (res.statusCode != 200) {
                                lg.error({
                                    message:
                                        "Failed to add to DB AGAIN, aborting and not adding to Redis",
                                    variables: {
                                        userID: userID,
                                        key: key,
                                    },
                                });
                                reject(err);
                            }
                        });
                } else {
                    resolve(res);
                }
            })
            .catch((err) => {
                lg.error("DB offline");
                reject(err);
            });
    });
}
module.exports = router;
