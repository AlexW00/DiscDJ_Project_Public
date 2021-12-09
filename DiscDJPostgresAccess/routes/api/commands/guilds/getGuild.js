const express = require("express");
const router = express.Router();
const db = require("../../../../postgres/sqlClient.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.get("/", getGuild);
async function getGuild(req, res) {
    let guildID = req.query["guildID"];
    if (guildID == undefined) {
        let errorMessage = "body: guildID = " + guildID;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
    performGetQuery(guildID)
        .then((guild) => {
            lg.info("guild gotten: " + guild);
            if (guild != null) res.json(guild);
            else
                performAddQuery(guildID)
                    .then(() => {
                        res.json({
                            id: guildID,
                            isPremium: false,
                        });
                    })
                    .catch((err) => {
                        lg.error(err);
                        res.sendStatus(500);
                    });
        })
        .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
        });
}

function performGetQuery(guildID) {
    const { ParameterizedQuery: PQ } = require("pg-promise");
    const queryString = `
        SELECT * FROM "testSchema".guilds AS g WHERE g.id = $1
    `;
    const query = new PQ({
        text: queryString,
        values: [guildID],
    });
    return db.oneOrNone(query);
}

function performAddQuery(guildID) {
    const { ParameterizedQuery: PQ } = require("pg-promise");
    const queryString = `
        INSERT INTO "testSchema".guilds ("id", "isPremium")
		VALUES($1, FALSE) ON CONFLICT (id)
		DO NOTHING
    `;

    const query = new PQ({
        text: queryString,
        values: [guildID],
    });
    return db.oneOrNone(query);
}

module.exports = router;
