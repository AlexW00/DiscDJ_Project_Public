module.exports = {
  name: "refreshCommands",
  description: "refreshes all commands on the server",

  async execute(message) {
    const { Collection } = require("discord.js");
    const client = message.client;
    const fs = require("fs");
    client.commands = new Collection();
    const commandFiles = fs
      .readdirSync("./commands")
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`../commands/${file}`);
      // set a new item in the Collection
      // with the key as the command name and the value as the exported module
      client.commands.set(command.name, command);
    }
  },
};
