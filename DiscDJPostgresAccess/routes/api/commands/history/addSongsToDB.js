const express = require("express");
const router = express.Router();
const db = require("../../../../postgres/sqlClient.js");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", addSongsToHistory);

function addSongsToHistory(req, res) {
    let queueItems = req.body;
    if (queueItems == undefined) {
        let errorMessage = "body: queueItem = " + queueItems;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    insertSongsInQueue(queueItems)
        .then((queueIDs) => insertInteractions(queueItems, queueIDs))
        .then((ids) => res.sendStatus(200))
        .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
        });
}
function insertInteractions(body, queueIDs) {
    lg.info(queueIDs);
    let ids = queueIDs.map((id) => {
        return id.id;
    });
    let interactions = body.map((e, index) => {
        return [
            e.interactions.likes.length,
            e.interactions.dislikes.length,
            e.interactions.saves.length,
            e.interactions.skipped,
            ids[index],
        ];
    });
    return db.tx((t) => {
        const queryList = interactions.map((e) => {
            return t.one(
                `
        INSERT INTO "testSchema".interactions
    SELECT
        q.id,
        $1,
        $2,
        $3,
        $4
    FROM
        "testSchema".song_queue AS q
    WHERE
        q.id = $5
    RETURNING "id"
          `,
                e
            );
        });
        return t.batch(queryList);
    });
}
function insertSongsInQueue(body) {
    console.log(body);
    const v = body.map((value) => {
        return [
            value.meta.timeAdded,
            value.meta.userID,
            value.meta.guildID,
            value.song.url,
        ];
    });

    return db.tx((t) => {
        const queryList = v.map((e) => {
            lg.info("QueryItem: " + e);
            return t.one(
                `
    INSERT INTO "testSchema".song_queue ("userID", "guildID", "songID", "timestamp")
    SELECT u.id, g.id, s.id, $1
	FROM "testSchema".users AS u
	CROSS JOIN "testSchema".guilds AS g
	CROSS JOIN "testSchema".songs AS s
	WHERE u.id = $2
	AND g.id = $3
	AND s.url = $4
    RETURNING "id"
`,
                e
            );
        });

        return t.batch(queryList);
    });
}
module.exports = router;
