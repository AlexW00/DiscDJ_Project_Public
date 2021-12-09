const express = require("express");
const router = express.Router();
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
const globalLB = require("./getGlobalLeaderboard.js");
const guildLB = require("./getGuildLeaderboard.js");
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
    getLeaderboards(guildID)
        .then((leaderboards) => {
            res.send(leaderboards);
        })
        .catch((err) => {
            lg.error(err);
            res.append("error", err);
            res.sendStatus(500);
        });
}
function getLeaderboards(guildID) {
    return new Promise((resolve, reject) => {
        Promise.all([
            globalLB.getGlobalLeaderboard(),
            guildLB.getGuildLeaderboard(guildID),
        ])
            .then((lbs) => resolve({ global: lbs[0], guild: lbs[1] }))
            .catch((err) => {
                lg.error(err);
                reject(err);
            });
    });
}

module.exports = router;
