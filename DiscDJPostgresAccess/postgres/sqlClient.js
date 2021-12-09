const config = require("./postgresOptions.js");
const pgp = require("pg-promise")({ capSQL: true });
// capitalize all generated SQL
const sqlClient = pgp(config);

module.exports = sqlClient;
