const fs = require("fs");
const ssl = {
    rejectUnauthorized: false,
    ca: fs.readFileSync(__dirname + "/ca-certificate.cer").toString(),
};

const postgresOptions = {
    host:
        process.env.DB_HOST ??
        "HOST_HERE",
    port: process.env.DB_PORT ?? 25060, // Postgres server port
    database: process.env.DB_NAME ?? "NAME_HERE", // Name of database to connect to
    user: "USER_HERE", // Username of database user
    password: "PASSWORD_HERE",
    ssl: ssl,
};
module.exports = postgresOptions;
