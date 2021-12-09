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
module.exports = {
    name: "disconnect",
    description: "Disconnects DiscDJ from the current channel",
    async execute(interaction) {
        let guildID = interaction.guildId,
            connection = getVoiceConnection(guildID);
        if (connection == null) {
            interaction.reply(Strings.channel.notConnected);
            return;
        } else {
            connection.destroy();
            interaction.reply(Strings.channel.disconnectSuccess);
        }
    },
};
