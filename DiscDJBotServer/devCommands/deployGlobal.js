module.exports = {
  name: "deployGlobal",
  description: "deploys slash globally",

  async execute(message) {
    let client = message.client;
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");
    const Config = require("../config/config.js");
    /* 
        assumes client is available in this context and that
         client#commands exists according to earlier guide sections
      */
    const commands = client.commands.map(({ execute, ...data }) => data);

    const rest = new REST({ version: "9" }).setToken(Config.botToken);

    (async () => {
      try {
        console.log("Started refreshing global application (/) commands");

        await rest.put(Routes.applicationCommands(Config.appID), {
          body: commands,
        });

        console.log("Sucessfully reloaded global application (/) commands.");
      } catch (error) {
        console.error(error);
      }
    })();
  },
};
