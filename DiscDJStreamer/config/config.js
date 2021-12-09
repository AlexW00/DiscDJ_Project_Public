Config = {
  redisPort: process.env.REDIS_PORT ?? 6379,
  redisHost: process.env.REDIS_HOST ?? "127.0.0.1",
  expressPort: process.env.EXPRESS_PORT ?? 3004,
  expressHost: process.env.EXPRESS_HOST ?? "127.0.0.1",
  listenerScore: 50,
  listenerWeight: 1,
  scorePerListener: 3,
  interactionsWeight: 1,
  likeScore: 5,
  dislikeScore: 5,
  saveScore: 25,
  maxScore: 500,
};
module.exports = Config;
