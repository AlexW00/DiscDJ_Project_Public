module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    const Config = require("../config/config.js");
    let client = interaction.client;
    if (!interaction.isCommand()) return;

    if (!client.commands.has(interaction.commandName)) return;

    try {
      await client.commands.get(interaction.commandName).execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
