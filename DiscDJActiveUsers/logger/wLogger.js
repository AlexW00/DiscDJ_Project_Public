const winston = require("winston");
var path = require("path");
const esTransportOpts = {
    level: "info",
};
const lg = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, "/errors/error.log"),
            level: "error",
        }), //save errors on file
        //new Elasticsearch(esTransportOpts) //everything info and above goes to elastic
    ],
});

if (process.env.NODE_ENV !== "production") {
    lg.add(
        new winston.transports.Console({
            //we also log to console if we're not in production
            format: winston.format.simple(),
        })
    );
}
module.exports = function (name) {
    // set the default moduleName of the child
    return lg.child({ module: name });
};
