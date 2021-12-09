//const { ApplicationCommandOptionTypes } = require("discord.js/typings/enums");
module.exports = {
  name: "log",
  description: "Logs the command provided",
  options: [
    {
      name: "text",
      type: 3,
      description: "The text to log back",
      required: true,
    },
  ],
  async execute(interaction) {
    //args.forEach((e) => interaction.reply(e));
    const superagent = require("superagent");
    let logContent = interaction.options.getString("text");
    superagent
      .post("127.0.0.1:3000/commands/addSong")
      .send({ title: logContent })
      .end((err, res) => {
        console.log("Data sent");
      });
    await interaction.reply(logContent);
  },
};
