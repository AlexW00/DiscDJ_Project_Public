const express = require("express");
const router = express.Router();
const db = require("../../../../postgres/sqlClient.js");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
router.post("/", updateScores);

function updateScores(req, res) {
    let scores = req.body;
    if (scores == undefined) {
        let errorMessage = "body: scores = " + scores;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }

    //TODO: working?
    //res.sendStatus(200);
    //return;
    lg.info(scores);
    insertScoresIntoDB(scores)
        .then(res.sendStatus(200))
        .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
        });
}

function insertScoresIntoDB(scores) {
    let heardBy = scores.heardBy,
        djID = scores.djID,
        listenerScore = scores.listenerScore,
        djScore = scores.djScore,
        guildID = scores.guildID;

    let sqlData = [];
    heardBy.forEach((userID) => {
        sqlData.push([listenerScore, userID, guildID]);
    });
    sqlData.push([djScore, djID, guildID]);

    return db.tx((t) => {
        const queryList = sqlData.map((e) => {
            return t.none(
                `
INSERT INTO "testSchema".scores ("userID", "guildID", "score")
	SELECT
	u.id,
	g.id,
    $1	
FROM
	"testSchema".users AS u
	CROSS JOIN "testSchema".guilds AS g
WHERE
	u.id = $2
	AND g.id = $3
ON CONFLICT ("userID", "guildID") DO UPDATE
SET score = EXCLUDED.score + scores.score
      `,
                e
            );
        });
        return t.batch(queryList);
    });
}
module.exports = router;
