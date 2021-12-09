Config = {
    redisPort: process.env.REDIS_PORT ?? 6379,
    redisHost: process.env.REDIS_HOST ?? "127.0.0.1",
    expressPort: process.env.EXPRESS_PORT ?? 3000,
    expressHost: process.env.EXPRESS_HOST ?? "127.0.0.1",
    maxQueueSize: 30,
};
module.exports = Config;
