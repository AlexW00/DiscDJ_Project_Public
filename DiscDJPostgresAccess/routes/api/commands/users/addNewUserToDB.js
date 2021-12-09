const express = require("express");
const router = express.Router();
const db = require("../../../../postgres/sqlClient.js");
var path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.post("/", addUserToDB);

async function addUserToDB(req, res) {
    let userID = req.query["userID"];
    if (userID == undefined) {
        let errorMessage = "params: userID = " + userID;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    performQuery(userID)
        .then((r) => sendResponse(r, res))
        .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
        });
}

function performQuery(userID) {
    const { ParameterizedQuery: PQ } = require("pg-promise");
    const queryString = `
        INSERT INTO "testSchema".users ("id")
		VALUES($1) ON CONFLICT (id)
		DO NOTHING
        RETURNING "id", "googleAuthToken", "spotifyAuthToken"
    `;
    const query = new PQ({
        text: queryString,
        values: [userID],
    });
    return db.oneOrNone(query);
}

function sendResponse(user, res) {
    if (user != null) res.json(user);
    else res.sendStatus(200);
}

module.exports = router;
