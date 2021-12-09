const express = require("express");
const router = express.Router();
const db = require("../../../../postgres/sqlClient.js");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.post("/", addSongToLibrary);

function addSongToLibrary(req, res) {
    let userID = req.query["userID"],
        queueItem = req.body;

    if (userID == undefined || queueItem == undefined) {
        let errorMessage = "params: userID = " + userID + " body: " + queueItem;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    insertSongsInLibrary(queueItem, userID)
        .then(res.sendStatus(200))
        .catch((err) => {
            res.sendStatus(500);
            console.log(err);
        });
}

function insertSongsInLibrary(queueItem, userID) {
    let values = [
        new Date().toISOString().slice(0, 19).replace("T", " "),
        userID,
        queueItem.meta.guildID,
        queueItem.song.url,
    ];

    return db.tx((t) => {
        t.none(
            `
        INSERT INTO "testSchema".library ("userID", "guildID", "songID", "date")
        SELECT
            u.id,
            g.id,
            s.id,
            $1
        FROM
            "testSchema".users AS u
            CROSS JOIN "testSchema".guilds AS g
            CROSS JOIN "testSchema".songs AS s
        WHERE
            u.id = $2
            AND g.id = $3
            AND s.url = $4
            ON CONFLICT ("userID", "guildID", "songID")  
            DO UPDATE 
            SET date = $1`,
            values
        );
    });
}
module.exports = router;
