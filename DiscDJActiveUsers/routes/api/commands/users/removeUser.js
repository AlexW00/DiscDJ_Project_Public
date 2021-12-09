const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.post("/", removeUserFromRoom);

function removeUserFromRoom(req, res) {
    let guildID = req.query["guildID"];
    let userID = req.query["userID"];
    let rLockName = guildID + "_" + path.basename(path.dirname(__filename));

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

    rLock(rLockName, function (done) {
        rClient.srem(rLockName, userID, function (err, reply) {
            if (err != null) {
                done();
                lg.error(err);
                res.sendStatus(500);
                return;
            } else if (reply === 1) {
                res.append("didRemoveSomeone", true);
                res.sendStatus(200);
            } else {
                res.append("didRemoveSomeone", false);
                res.sendStatus(200);
            }
            done();
        });
    });
}
module.exports = router;
