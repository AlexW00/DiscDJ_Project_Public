var path = require("path");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const Strings = require("../config/strings.json");
const QueueItem = require("../objects/QueueItem.js");
const YouTube = require("youtube-sr").default;
const addSong = require("../api/addSong.js");
const playNextSong = require("../voice/playNextSong.js");

const { getVoiceConnection, AudioPlayerStatus } = require("@discordjs/voice");
const { VoiceConnectionStatus } = require("@discordjs/voice");

module.exports = {
    name: "play",
    description: "plays the song provided",
    options: [
        {
            name: "title",
            type: 3,
            description: "song title",
            required: true,
        },
        {
            name: "artist",
            type: 3,
            description: "artist name",
            required: false,
        },
    ],
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id),
            inputTitle = interaction.options.getString("title"),
            inputArtist = interaction.options.getString("artist"),
            userInputValidity = checkUserInputValidity({
                title: inputTitle,
                artist: inputArtist,
            });
        if (!userInputValidity.isAllowed) {
            // user input is illegal
            interaction.reply(userInputValidity.reason);
        } else if (!isConnectedAndReady(connection)) {
            // bot is not connected (& in ready state) to channel
            interaction.reply(Strings.channel.notConnected);
        } else {
            // search and pick first result
            searchYoutubeForSong(inputTitle, inputArtist)
                .then((r) =>
                    r.rejectReason != null
                        ? // result not allowed
                          Promise.resolve(r.rejectReason)
                        : //result allowed -> queue it up
                          sendToQueue(r.result, interaction, connection)
                )
                .then((message) => {
                    // respond to interaction with custom msg
                    interaction.reply(message);
                })
                .catch((err) => {
                    lg.error(err);
                    interaction.reply(Strings.command.error);
                });
        }
    },
};

// ====================================================== //
// =================== Main procedures ================== //
// ====================================================== //

searchYoutubeForSong = (title, artist) => {
    return YouTube.search(title + " " + (artist || ""), {
        limit: 1,
        safeSearch: true,
    }).then((results) => verifyResultValidity(results[0]));
};

verifyResultValidity = (result) => {
    return new Promise((resolve, reject) => {
        if (result == undefined || result?.title == undefined)
            resolve(Strings.song.notFound);

        let check = checkSearchResultValidity(result);
        if (!check.isAllowed) resolve({ result, rejectReason: check.reason });
        else resolve({ result });
    });
};

sendToQueue = (result, interaction, connection) => {
    let queueItem = new QueueItem({
        title: result.title,
        url: "http://www.youtube.com/watch?v=" + result.id,
        length: result.duration / 1000,
        guildID: interaction.guild.id,
        userID: interaction.user.id,
        timeAdded: interaction.createdAt,
        username: interaction.user.tag,
        useravatar: interaction.user.displayAvatarURL(),
        guildname: interaction.guild.name,
    });
    return addSong(queueItem).then((addedQueueItem) => {
        if (addedQueueItem.hasAlreadyQueuedItem()) {
            // if user is already is in queue
            return Promise.resolve(getAlreadyInQueueString(addedQueueItem));
        } else if (addedQueueItem.queue.queueIsFull) {
            // if queue is full
            return Promise.resolve(Strings.queue.isFull);
        } else if (shouldPlayNextSong(addedQueueItem, connection)) {
            // if song = only one in queue & nothing else currently playing
            return autoPlayNextSong(connection, interaction.channelId);
        } else {
            // if song was added to end of queue
            return Promise.resolve({
                embeds: [addedQueueItem.getNewAddedEmbed()],
            });
        }
    });
};

autoPlayNextSong = (connection, channelId) => {
    return playNextSong(connection, channelId).then((nowPlayingQueueItem) =>
        Promise.resolve({
            embeds: [nowPlayingQueueItem.getEmbed()],
        })
    );
};

// ====================================================== //
// =================== Boolean helpers ================== //
// ====================================================== //

isConnectedAndReady = (connection) => {
    return (
        connection != null &&
        connection.state != null &&
        connection.state.status == VoiceConnectionStatus.Ready
    );
};

shouldPlayNextSong = (queueItem, connection) => {
    return (
        queueItem.queue.spot == 0 &&
        queueItem.queue.queueLength == 1 &&
        connection.state.subscription?.player.state.status != "playing"
    );
};

checkUserInputValidity = (input) => {
    if (input.title.length < 3) {
        return { isAllowed: false, reason: Strings.command.illegalLength };
    }
    return { isAllowed: true };
};

checkSearchResultValidity = (result) => {
    if (result.duration > 600000) {
        return { isAllowed: false, reason: Strings.song.illegalLength };
    }
    return { isAllowed: true };
};

// ====================================================== //
// ================== String genrators ================== //
// ====================================================== //

getAlreadyInQueueString = (queueItem) => {
    return (
        Strings.queue.alreadyInQueue_1 +
        queueItem.queue.alreadyQueuedItem.song.title +
        Strings.queue.alreadyInQueue_2 +
        queueItem.getViewQueueSpot()
    );
};
