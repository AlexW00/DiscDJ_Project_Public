const Strings = require("../config/strings.json");
module.exports = CurrentSongEmbed = (queueItem) => {
    return {
        color: 0x0099ff,
        title: queueItem.song.title,
        url: queueItem.song.url,
        description: Strings.song.currentSongStandardEmbedDescription,
        thumbnail: {
            url:
                "https://img.youtube.com/vi/" +
                queueItem.getVideoID() +
                "/0.jpg",
        },

        timestamp: queueItem.meta.timeAdded,
        footer: {
            text: "Added by " + queueItem.cache.username,
            icon_url: queueItem.cache.useravatar,
        },
    };
};
