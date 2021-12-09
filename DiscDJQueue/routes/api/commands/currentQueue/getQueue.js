const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.get("/", getQueue);

function getQueue(req, res) {
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
        rClient.lrange(key, 0, -1, function (err, reply) {
            if (err != null) {
                lg.error(err);
                res.sendStatus(500);
            } else res.send(reply);
            done();
        });
    });
}
module.exports = router;
