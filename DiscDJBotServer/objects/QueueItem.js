const CurrentSongEmbed = require("../embeds/CurrentSongEmbed.js");
const NewQueueItemEmbed = require("../embeds/NewQueueItemEmbed.js");
const QueueItemEmbed = require("../embeds/QueueItemEmbed.js");
const ObjectFlattener = require("../utils/ObjectFlattener.js");
class QueueItem {
    constructor(params) {
        this.song = {
            title: params.title,
            url: params.url,
            length: params.length,
        };
        this.meta = {
            guildID: params.guildID,
            userID: params.userID,
            timeAdded: params.timeAdded,
        };
        this.interactions = {
            likes: [],
            dislikes: [],
            saves: [],
            skipped: params.skipped ?? false,
        };
        this.queue = {
            alreadyQueuedItem:
                params.alreadyQueuedItem == null ||
                params.alreadyQueuedItem?.song?.title == null
                    ? {}
                    : new QueueItem(ObjectFlattener(params.alreadyQueuedItem)),
            spot: params.spot ?? -1,
            queueLength: params.queueLength ?? -1,
            queueIsFull: params.queueIsFull ?? false,
        };
        this.cache = {
            username: params.username,
            useravatar: params.useravatar,
            guildname: params.guildname,
        };
    }

    async getSongInfo() {
        const ytly = require("ytly");
        if (this.songInfo == undefined) {
            this.songInfo = await ytly.get.info(this.song.url);
        }
        console.log(this.songInfo);
        return this.songInfo;
    }

    getEmbed() {
        if (this.queue.spot == 0) return CurrentSongEmbed(this);
        else return QueueItemEmbed(this);
    }
    getNewAddedEmbed() {
        return NewQueueItemEmbed(this);
    }

    getSpotInfo() {
        return {
            queueLength: this.queueLength,
            ascii: this._generateAscii(this.queue.queueLength),
        };
    }

    _generateAscii(queueLength) {
        const ratio = (queueLength - this.getViewQueueSpot()) / queueLength,
            totalLength = 20,
            startingPoint = Math.floor(20 * (queueLength == 1 ? 1 : ratio));
        console.log(ratio);
        let asciiBar = "[";
        for (let index = 0; index < totalLength; index++) {
            if (index === (startingPoint - 1 == -1 ? 0 : startingPoint - 1))
                asciiBar =
                    asciiBar + `(${this.getViewQueueSpot()}/${queueLength})`;
            if (index === totalLength - 1) asciiBar = asciiBar + "▸]";
            else asciiBar = asciiBar + "■";
            console.log(asciiBar);
        }
        return asciiBar;
    }

    getVideoID() {
        var regExp =
            /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = this.song.url.match(regExp);
        if (match && match[2].length == 11) {
            return match[2];
        } else {
            //TODO: ADDERROR
        }
    }

    hasAlreadyQueuedItem() {
        return (
            this.queue.alreadyQueuedItem != null &&
            this.queue.alreadyQueuedItem.song != null
        );
    }

    getViewQueueSpot() {
        return this.queue.spot + 1;
    }

    toString() {
        return JSON.stringify({
            song: this.song,
            meta: this.meta,
            interactions: this.interactions,
            queue: this.queue,
            cache: this.cache,
        });
    }
}
module.exports = QueueItem;
