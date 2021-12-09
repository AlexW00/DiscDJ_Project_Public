const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");

var path = require('path');
const lg = require("../../../../logger/wLogger.js")(path.basename(__dirname) + '/' + path.basename(__filename, '.js'));

router.post("/", addUserToRoom);

function addUserToRoom(req, res) {
  let guildID = req.query["guildID"];
  let userID = req.query["userID"];
  if (guildID == undefined || userID == undefined) {
    let errorMessage = "invalid parameters: " + "guildID: " + guildID + "; userID: " + userID;
    res.append("reason" , errorMessage)
    res.sendStatus(422)
    lg.error(errorMessage)
    return
  }
  let key = guildID + "_" + path.basename(path.dirname(__filename));

  rLock(key, function (done) {
    checkIfIsMember(key, userID).then(reply => {
      if (reply == 0) {
        rClient.sadd(key, userID);
        sendUserToCache(userID)
          .then(() => {
            res.append("wasAlreadyInRoom", false);
            res.sendStatus(200);
          })
          .catch((err) => {
            lg.error(err);
            res.sendStatus(500);
          });
      } else {
        res.append("wasAlreadyInRoom", true);
        res.sendStatus(200);
      }
    }).catch(err => {
      lg.error(err)
      res.sendStatus(500)
    })
    done();
  });
}

function checkIfIsMember(key, userID) {
  return new Promise((resolve, reject) => {
    rClient.sismember(key, userID, function (err, reply) {
      if (err != null) reject(err);
      else resolve(reply);
    });
  })
}

function sendUserToCache(userID) {
  const config = require("../../../../config/config.js");
  const superagent = require("superagent");
  return superagent
    .post(config.expressHost + ":3010" + "/api/commands/users/addNewUserToDB")
    .set("Content-Type", "application/json; charset=utf-8")
    .query("userID=" + userID);
}
module.exports = router;
