const pullNextSong = require("../api/pullNextSong.js");
const {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const path = require("path");
const Strings = require("../config/strings.json");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

module.exports = playNextSong = (connection, channelId) => {
    return new Promise((resolve, reject) => {
        pullNextSong(connection.joinConfig.guildId)
            .then((queueItem) =>
                playQueueItemOnConnection(queueItem, connection)
            )
            .then((playInfo) => {
                if (playInfo != null) {
                    registerEventListeners(
                        playInfo.player,
                        connection,
                        channelId
                    );
                    connection.subscribe(playInfo.player);
                    resolve(playInfo.queueItem);
                } else resolve("noPull");
            })
            .catch((error) => {
                lg.error(error);
                reject(error);
            });
    });
};

playQueueItemOnConnection = (queueItem, connection) => {
    return new Promise((resolve, reject) => {
        if (queueItem == null || queueItem.song == null) resolve(null);
        let player =
            connection.state.subscription != null
                ? connection.state.subscription.player
                : createAudioPlayer();
        player.play(createAudioResource(ytdl(queueItem.song.url)));
        resolve(new PlayInfo(player, queueItem));
    });
};

// ====================================================== //
// ==================== Player events =================== //
// ====================================================== //

registerEventListeners = (player, connection, channelId) => {
    player.on("unsubscribe", (event) => {
        console.log("event: ");
        console.log(event);
    });
    // player -> idle mode
    player.on(AudioPlayerStatus.Idle, () => {
        pullNextSong(connection.joinConfig.guildId)
            .then((queueItem) =>
                playQueueItemOnConnection(queueItem, connection)
            )
            .then((playInfo) => {
                lg.info("idle, play next");
                if (playInfo != null)
                    channelId.send({
                        embeds: [playInfo.queueItem.getEmbed()],
                    });
                else channelId.send(Strings.queue.isEmpty);
            })
            .catch((err) => {
                lg.error(err);
            });
    });
};

// ====================================================== //
// =================== Helper Objects =================== //
// ====================================================== //

class PlayInfo {
    constructor(player, queueItem) {
        (this.player = player), (this.queueItem = queueItem);
    }
}
