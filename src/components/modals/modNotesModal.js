const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const Temp = require("../../schemas/temp");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: `mod-notes-modal`,
  },
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const tempDoc = await Temp.findOne({ tempValueOne: "app-review" });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }

    const logChannel = client.channels.cache.get(config.logChannelID);
    const user = tempDoc.tempValueTwo;
    let modNotes = interaction.fields.getTextInputValue("modNotes");
    const app = await App.findOne({ userID: user });
    const existingNotes = app.moderatorNotes || ' ';

    let date_time = new Date();

    let date = ("0" + date_time.getDate()).slice(-2);

    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);

    let year = date_time.getFullYear();

    let hours = date_time.getHours();

    let minutes = date_time.getMinutes();

    const datentime =
      date + "-" + month + "-" + year + " " + hours + ":" + minutes;

    modNotes = `${modNotes} - **${interaction.user.tag} on ${datentime}**.`;

    await interaction.deferReply({ ephemeral: true });

    const updateDoc = {
      $set: {
        moderatorNotes: `${existingNotes}\n${modNotes}`,
      },
    };

    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const filter = { userID: user };
    await appColl.updateOne(filter, updateDoc);
    await interaction.editReply({
      content: `Updated <@${user}>'s notes.`,
    });
    await logChannel.send(
      `<@${user}>'s notes have been updated by ${interaction.user.tag}.`
    );
  },
};
