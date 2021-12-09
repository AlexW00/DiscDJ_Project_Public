const express = require("express");
const router = express.Router();
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const db = require("../../../../postgres/sqlClient.js");
router.post("/", addSongToDB);

async function addSongToDB(req, res) {
    let song = req.body;
    if (song == undefined) {
        let errorMessage = "body: song = " + song;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    performQuery(song)
        .then((r) => sendResponse(r, res))
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
}

function performQuery(song) {
    const { ParameterizedQuery: PQ } = require("pg-promise");
    const songParams = [song.title, song.url, song.length];
    const queryString = `
        INSERT INTO "testSchema".songs ("title", "url", "durationSeconds")
	VALUES($1, $2, $3) ON CONFLICT (url)
		DO NOTHING
        RETURNING "id"
    `;
    const query = new PQ({
        text: queryString,
        values: songParams,
    });
    return db.oneOrNone(query);
}
function sendResponse(song, res) {
    if (song != undefined) res.json(song);
    else res.sendStatus(200);
}

module.exports = router;
