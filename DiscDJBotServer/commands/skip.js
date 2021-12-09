//const { ApplicationCommandOptionTypes } = require("discord.js/typings/enums");
const superagent = require("superagent");
const path = require("path");
const lg = require("../logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);
const { joinVoiceChannel } = require("@discordjs/voice");
const { VoiceConnectionStatus } = require("@discordjs/voice");
const { getVoiceConnection } = require("@discordjs/voice");
const Strings = require("../config/strings.json");
const playNextSong = require("../voice/playNextSong.js");
module.exports = {
    name: "skip",
    description: "Skips the current song",
    async execute(interaction) {
        //TODO: Check permission

        let guildID = interaction.guildId,
            connection = getVoiceConnection(guildID);

        if (connection == null) {
            interaction.reply(Strings.channel.notConnected);
            return;
        } else {
            playNextSong(connection, interaction.channelId).then(
                (queueItem) => {
                    console.log(queueItem);
                    if (queueItem == "noPull") {
                        interaction.reply(Strings.queue.isEmpty);
                        return;
                    } else
                        interaction.reply({
                            embeds: [queueItem.getEmbed()],
                        });
                }
            );
        }
    },
};
