const rClient = require("./redis_db.js");
const rLock = require("redis-lock")(rClient);
module.exports = rLock;
