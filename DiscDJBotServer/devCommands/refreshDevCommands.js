module.exports = {
  name: "refreshDevCommands",
  description: "refreshes all commands on the server",

  async execute(message) {
    const { Collection } = require("discord.js");
    const client = message.client;
    const fs = require("fs");
    client.devCommands = new Collection();
    const commandFiles = fs
      .readdirSync("./devCommands")
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`./${file}`);
      // set a new item in the Collection
      // with the key as the command name and the value as the exported module
      client.devCommands.set(command.name, command);
    }
  },
};
