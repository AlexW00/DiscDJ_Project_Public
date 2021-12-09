const express = require("express");
const router = express.Router();
const stringHash = require("string-hash");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
router.get("/", getGuild);

function getGuild(req, res) {
    let guildID = req.query["guildID"],
        key = "guild_cache";
    if (guildID == undefined || guildID.length <= 5) {
        let errorMessage = "Wrong parameters: guildID = " + guildID;
        lg.error(errorMessage);
        res.append("reason", errorMessage);
        res.sendStatus(422);
        return;
    }

    checkIfGuildIsCached(res, guildID, key)
        .then((guild) => res.json(guild))
        .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
        });
}

function checkIfGuildIsCached(res, guildID, key) {
    return new Promise((resolve, reject) => {
        rLock(key, function (done) {
            rClient.hexists(key, stringHash(guildID), function (err, reply) {
                lg.info("checked cache");
                if (err != null) {
                    lg.error(err);
                    reject(err);
                }
                if (reply != 1) {
                    res.append("wasCached", false);
                    obtainGuildInfo(false, guildID, key)
                        .then((guild) => resolve(guild))
                        .catch((err) => {
                            lg.error(err);
                            reject(err);
                        });
                } else {
                    res.append("wasCached", true);
                    rClient.hget(
                        key,
                        stringHash(guildID),
                        function (err, reply) {
                            if (err != null) {
                                lg.error(err);
                                reject(err);
                            }
                            let guildObj = {
                                id: guildID,
                                isPremium: reply === true,
                            };
                            resolve(guildObj);
                        }
                    );
                }
            });
            done();
        });
    });
}

function obtainGuildInfo(wasCached, guildID, key) {
    return new Promise((resolve, reject) => {
        if (wasCached)
            getGuildFromRedis(guildID, key)
                .then((guild) => resolve(guild))
                .catch((err) => {
                    lg.error(err);
                    reject(err);
                });
        else
            getGuildFromDB(guildID, key)
                .then((guild) => resolve(guild))
                .catch((err) => {
                    lg.error(err);
                    reject(err);
                });
    });
}

function getGuildFromRedis(guildID, key) {
    return new Promise((resolve, reject) => {
        rClient.hget(key, stringHash(guildID), function (err, reply) {
            if (err != null) {
                lg.err("getFromRedis" + err);
                reject(err);
            }
            let guildObj = {
                id: guildID,
                isPremium: reply === true,
            };
            resolve(guildObj);
        });
    });
}
async function getGuildFromDB(guildID, key) {
    const config = require("../../../../config/config.js");
    const superagent = require("superagent");
    return new Promise((resolve, reject) => {
        superagent
            .get(config.expressHost + ":3010" + "/api/commands/guilds/getGuild")
            .set("Content-Type", "application/json; charset=utf-8")
            .query("guildID=" + guildID)
            .then((res) => {
                if (res.body == undefined || res.body.id == undefined) {
                    lg.info(
                        "getGuildFromDB _ key: " + key + " guildID " + guildID
                    );
                    addGuild(key, guildID)
                        .then((guild) => resolve(guild))
                        .catch((err) => reject(err));
                } else {
                    console.log(res.body);
                    let guild = res.body;
                    let id = guild.id,
                        isPremium = guild.isPremium;

                    rClient.hset(
                        key,
                        stringHash(id),
                        isPremium,
                        function (err, res) {
                            if (err != null) reject(err);
                            else resolve(guild);
                        }
                    );
                }
            })
            .catch((err) => {
                lg.error("getGuildFromDB" + err);
                reject(err);
            });
    });
}

function addGuild(key, guildID) {
    return new Promise((resolve, reject) => {
        addGuildToDB(guildID)
            .then((guild, err) => {
                if (err != null) reject(err);
                return addGuildToRedis(key, guild);
            })
            .then((guild, err) => {
                if (err != null) reject(err);
                else resolve(guild);
            });
    });
}

function addGuildToRedis(key, guild) {
    return new Promise((resolve, reject) => {
        rClient.hset(
            key,
            stringHash(guild.id),
            guild.isPremium,
            function (err, res) {
                if (err != null) reject(err);
                else resolve(guild);
            }
        );
    });
}

async function addGuildToDB(guildID) {
    return new Promise((resolve, reject) => {
        const config = require("../../../../config/config.js");
        const superagent = require("superagent");
        console.log("adding to db");
        return superagent
            .post(
                config.expressHost +
                    ":3010" +
                    "/api/commands/guilds/addNewGuildToDB"
            )
            .set("Content-Type", "application/json; charset=utf-8")
            .query("guildID=" + guildID)
            .then((res) => {
                let guild = {
                    id: guildID,
                    isPremium: false,
                };

                resolve(guild);
            })
            .catch((err) => reject(err));
    });
}
module.exports = router;
