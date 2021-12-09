const express = require("express");
const router = express.Router();
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

router.get("/", get);
async function get(req, res) {
    let url = req.query["url"];
    if (url == undefined) {
        let errorMessage = "body: url = " + url;
        lg.error(errorMessage);
        res.append("error", errorMessage);
        res.sendStatus(422);
        return;
    }
}

module.exports = router;
