const express = require("express");
const router = express.Router();
const path = require("path");
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");

router.get("/", clearQueue);

function clearQueue(req, res) {
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
        rClient.del(key, function (err, reply) {
            if (err != null) {
                lg.error(err);
                res.sendStatus(500);
            } else {
                res.append("numOfRemovedSong", reply);
                res.send("200");
            }
            done();
        });
    });
}
module.exports = router;
