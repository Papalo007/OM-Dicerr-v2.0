const { SlashCommandBuilder } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot!")
    .setDMPermission(false),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    await interaction.reply({
      content: `If you want to quit the setup stage, send the message "Exit". This will reset the setup and you can start over.
If at any point you want to go to the previous question to answer it again, send the message "Back". With this you can change your answer in a previous question. After 20 minutes, the program will exit if the setup process is not done.`,
    });

    const questions = [
      "Do you want to enable the Teams module? Answer with Yes or No.",
      "Please enter the team's name, along with their short codes (One More -> OM). If there are multiple teams, use the following format: Team1 name Team1 short-code, Team2 name, Team2 short-code etc.",
      "What is the ID of the Team's manager role? (right click the role -> Copy Role ID) A team manager can recruit and kick players from the team's roster. If there are multiple teams, seperate the IDs using a comma (The order should be the same as the one you used in the previous step).",
      "Which roles (send the role ID of them) should be able to review someone's application? These can add notes, delete, add missed matches and remove missed matches from the application, but only the team manager roles can recruit someone.",
      "What is the ID of the staff role? If there are multiple, seperate them using a comma. These roles will be able to warn members, purge messages and check the warnings of a user.",
      "What is the Role ID of the applicant role? (Whoever applies will get that role). If you want none, reply with \"None\" (not recommended).",
      "What is the ID of the log channel? This is going to be the channel where all logs will be sent (application submitted, warned/kicked/banned/unbanned/recruited/sacked a user etc.)",
      "What is the ID of the Roster-Changes channel? This is the channel where changes in a team's roster will be announced. (if you don't want to add one, send the message \"None\".",
      "What is the ID of the bot commands channel/s? This is the channel/s where bot commands will work, any other channel will not recognize commands. If there are multiple channels you would like to add, seperate them using a comma. If you want to use commands in all channels, reply with \"None\"."
    ];

    const exitCollector = interaction.channel.createMessageCollector({
      //conditions
      filter: (message) =>
        message.content.toLowerCase() === "exit" &&
        message.channelId === interaction.channel.id &&
        message.author === interaction.user,
      time: 20 * 60_000,
    });

    let done;

    exitCollector.on("collect", (message) => {
      message.reply("Exiting...");
      done = true;
      exitCollector.stop();
      return;
    });

    const backCollector = interaction.channel.createMessageCollector({
      filter: (message) =>
        message.content.toLowerCase() === "back" &&
        message.channelId === interaction.channel.id &&
        message.author === interaction.user,
      time: 20 * 60_000,
    });

    backCollector.on("collect", (message) => {
      //What to do when going back
    });

    backCollector.on("end", () => {
      if (!done) {
        interaction.channel.send(
          "20 Minutes passed without finishing setup. Exiting..."
        );
      }
    });

    exitCollector.on("end", () => {
      if (!done) {
        interaction.channel.send(
          "20 Minutes passed without finishing setup. Exiting..."
        );
      }
    });
  },
};
