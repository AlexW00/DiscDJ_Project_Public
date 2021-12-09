const express = require("express");
const router = express.Router();
const rClient = require("../../../../redis/redis_db.js");
const rLock = require("../../../../redis/rLock.js");
const path = require("path");
const lg = require("../../../../logger/wLogger.js")(path.basename(__dirname) + '/' + path.basename(__filename, '.js'));

router.post("/", getUsers);

function getUsers(req, res) {

  let guildID = req.query["guildID"];
  if (guildID == undefined) {
    res.append("reason" , "no guildID provided")
    res.sendStatus(422)
    lg.error("no guildID provided")
    return
  }
  let key = guildID + "_" + path.basename(path.dirname(__filename));
  rLock(key, function (done) {
    getUsersFromRedis(key, done)
    .then(users => {
      res.json(users);
    }).catch(err => {
      lg.error(err);
      res.sendStatus(500)
    })
  });
}

function getUsersFromRedis(key, done) {
  return new Promise((resolve, reject) => {
    rClient.smembers(key, function (err, reply) {
      done();
      if (err != null) reject(err)
      let users = [];
      if (reply != null) users = reply;
      resolve(users)
    });
  })
}
module.exports = router;
