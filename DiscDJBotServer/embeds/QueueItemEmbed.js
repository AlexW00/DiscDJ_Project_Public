module.exports = QueueItemEmbed = (queueItem) => {
    return {
        color: 0x0099ff,
        title: queueItem.song.title,
        url: queueItem.song.url,
        description: "Spot in queue:\n" + queueItem.getSpotInfo().ascii + "\n ",
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
