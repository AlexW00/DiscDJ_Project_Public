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
    name: "join",
    description: "Joins the provided channel",
    options: [
        {
            name: "channel",
            type: 7,
            description: "Channel to join",
            required: true,
        },
    ],
    async execute(interaction) {
        if (
            !["GUILD_VOICE", "GUILD_STAGE_VOICE"].includes(
                interaction.options.getChannel("channel").type
            )
        ) {
            interaction.reply(Strings.channel.illegalChannel);
            return;
        }

        let channelID = interaction.options.getChannel("channel").id,
            guildID = interaction.guildId;
        lg.info("Joined channel: " + channelID);

        let connection =
            getVoiceConnection(guildID) ??
            joinVoiceChannel({
                channelId: channelID,
                guildId: guildID,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

        if (connection == null || connection.joinConfig.channelId != channelID)
            connection = joinVoiceChannel({
                channelId: channelID,
                guildId: guildID,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

        interaction.reply(
            Strings.channel.joinSuccess +
                interaction.options.getChannel("channel").toString()
        );
    },
};
