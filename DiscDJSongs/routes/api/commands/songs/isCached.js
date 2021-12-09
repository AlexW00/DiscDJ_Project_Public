const express = require("express");
const router = express.Router();
const rLock = require("../../../../redis/rLock.js");
const rClient = require("../../../../redis/redis_db.js");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.post("/", checkIfSongIsCached);

function checkIfSongIsCached(req, res) {
    if (req.body == undefined || req.body.url == undefined) {
        let errorMessage = "body: song = " + req.body;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    let song = req.body,
        songURL = song.url,
        key = "songCache";
    rLock(key, function (done) {
        rClient.sismember(key, songURL, function (err, reply) {
            if (err != null) {
                lg.error(err);
                res.sendStatus(500);
                done();
                return;
            }
            if (reply != 1) {
                rClient.sadd(key, songURL, function (err, reply) {
                    if (err != null) {
                        lg.error(err);
                        res.sendStatus(500);
                        done();
                        return;
                    }
                    res.append("wasCached", false);
                    addSongToDB(req.body)
                        .then((response) => {
                            res.sendStatus(200);
                        })
                        .catch((err) => {
                            console.log(err);
                            res.sendStatus(500);
                        });
                });
            } else {
                res.append("wasCached", true);
                res.sendStatus(200);
            }
        });
        done();
    });
}

function addSongToDB(song) {
    const config = require("../../../../config/config.js");
    const superagent = require("superagent");
    return superagent
        .post(config.expressHost + ":3010" + "/api/commands/songs/addSongToDB")
        .set("Content-Type", "application/json; charset=utf-8")
        .send(song);
}
module.exports = router;
