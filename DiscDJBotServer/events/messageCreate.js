module.exports = {
  name: "messageCreate",
  async execute(message) {
    const Config = require("../config/config.js");
    let client = message.client;
    if (!client.application.owner) await client.application.fetch();

    let cmd = message.content.substring(1);
    let prefix = message.content.charAt(0);

    if (prefix === Config.devCommandPrefix) {
      if (!client.devCommands.has(cmd)) return;
      try {
        await client.devCommands.get(cmd).execute(message);
      } catch (error) {
        console.error(error);
        await message.reply({
          content: "There was an error while executing this dev command!",
          ephemeral: true,
        });
      }
    }
  },
};
