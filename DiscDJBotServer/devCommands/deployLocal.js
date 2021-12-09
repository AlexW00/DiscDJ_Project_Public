module.exports = {
  name: "deployLocal",
  description: "deploys slash locally",

  async execute(message) {
    let client = message.client;
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");

    /* 
        assumes client is available in this context and that
         client#commands exists according to earlier guide sections
      */
    const commands = client.commands.map(({ execute, ...data }) => data);
    const Config = require("../config/config.js");
    const rest = new REST({ version: "9" }).setToken(Config.botToken);

    (async () => {
      try {
        console.log("Started refreshing local application (/) commands");

        await rest.put(
          Routes.applicationGuildCommands(Config.appID, message.guild.id),
          { body: commands }
        );

        console.log("Sucessfully reloaded local application (/) commands.");
      } catch (error) {
        console.error(error);
      }
    })();
  },
};
