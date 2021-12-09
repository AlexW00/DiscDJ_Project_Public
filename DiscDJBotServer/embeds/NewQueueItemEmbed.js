module.exports = QueueItemEmbed = (queueItem) => {
    return {
        color: 0x0099ff,
        title: queueItem.song.title,
        url: queueItem.song.url,
        description:
            "🎊 Successfully added your song to the queue:\n" +
            queueItem.getSpotInfo().ascii +
            "\n ",
        thumbnail: {
            url:
                "https://img.youtube.com/vi/" +
                queueItem.getVideoID() +
                "/0.jpg",
        },
    };
};
