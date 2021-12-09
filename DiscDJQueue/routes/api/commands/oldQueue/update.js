const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", update);

function update(req, res) {
    let like = req.query["likes"] ?? "",
        dislike = req.query["dislikes"] ?? "",
        save = req.query["saves"] ?? "",
        guildID = req.query["guildID"];
    if (guildID == undefined) {
        let errorMessage = "body: guildID = " + guildID;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let key = guildID + "_" + path.basename(path.dirname(__filename));
    rLock(key, function (done) {
        redisGetSong(key)
            .then((currentSong) =>
                updateScore(currentSong, like, dislike, save, res)
            )
            .then((updatedSong) => redisSaveSong(updatedSong, key))
            .then((updatedSong) => {
                res.send(updatedSong.interactions);
                done();
            })
            .catch((error) => {
                lg.error(error);
                res.sendStatus(500);
                done();
                return;
            });
    });
}

function updateScore(currentSong, like, dislike, save, res) {
    lg.info("updating: " + currentSong);
    return new Promise((resolve, reject) => {
        if (like !== "" && !currentSong.interactions.likes.includes(like)) {
            currentSong.interactions.likes.push(like);
            res.set("likes", currentSong.interactions.likes.length);
            var index = currentSong.interactions.dislikes.indexOf(like);
            if (index !== -1) {
                currentSong.interactions.dislikes.splice(index, 1);
            }
        }
        if (
            dislike !== "" &&
            !currentSong.interactions.dislikes.includes(dislike)
        ) {
            currentSong.interactions.dislikes.push(dislike);
            res.set("dislikes", currentSong.interactions.dislikes.length);
            var index = currentSong.interactions.likes.indexOf(dislike);
            if (index !== -1) {
                currentSong.interactions.likes.splice(index, 1);
            }
        }
        if (save !== "" && !currentSong.interactions.saves.includes(save)) {
            currentSong.interactions.saves.push(save);
            res.set("saves", currentSong.interactions.saves.length);
            addSongToLibraryDB(save, currentSong)
                .catch((err) => {
                    lg.error(err);
                    reject(err);
                    return;
                })
                .then(() => {
                    lg.info("Resolving " + currentSong);
                    resolve(currentSong);
                });
        } else {
            lg.info("Resolving " + currentSong);
            resolve(currentSong);
        }
    });
}
function redisSaveSong(updatedSong, key) {
    lg.info("saving: " + updatedSong);
    return new Promise((resolve, reject) => {
        rClient.lset(
            key,
            0,
            JSON.stringify(updatedSong),
            function (err, reply) {
                if (err != null) {
                    lg.error(err);
                    reject(err);
                } else {
                    resolve(updatedSong);
                }
            }
        );
    });
}

function redisGetSong(key) {
    return new Promise((resolve, reject) => {
        rClient.lindex(key, 0, function (err, reply) {
            if (err != null) {
                lg.error(err);
                reject(err);
            } else if (reply == null || reply.length == 0) {
                let errorMessage = "guild with id = " + guildID + " not found";
                lg.error(errorMessage);
                reject(errorMessage);
            } else {
                currentSong = JSON.parse(reply);
                resolve(currentSong);
            }
        });
    });
}

function addSongToLibraryDB(userID, queueItem) {
    const superagent = require("superagent");
    return superagent
        .post("http://127.0.0.1:3010/api/commands/library/addSongToLibrary")
        .send(queueItem)
        .set("Content-Type", "application/json; charset=utf-8")
        .query({ userID: userID });
}
module.exports = router;
