// require the discord.js module
// create a new Discord client
const { Client, Collection, Intents } = require("discord.js");
const fs = require("fs");
const Config = require("./config/config.js");
const path = require("path");
const lg = require("./logger/wLogger.js")(
    path.basename(__dirname) + "/" + path.basename(__filename, ".js")
);

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});
client.commands = new Collection();
client.devCommands = new Collection();

console.log("Hi there2");
client.login(Config.botToken);

const commandFiles = fs
    .readdirSync("./commands/")
    .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

const devCommandFiles = fs
    .readdirSync("./devCommands/")
    .filter((file) => file.endsWith(".js"));
for (const file of devCommandFiles) {
    const command = require(`./devCommands/${file}`);
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.devCommands.set(command.name, command);
}

const eventFiles = fs
    .readdirSync("./events/")
    .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}
