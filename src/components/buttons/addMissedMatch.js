const Temp = require("../../schemas/temp");
const Config = require("../../schemas/config");
const App = require("../../schemas/application");
const { MongoClient } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  data: {
    name: "missed-match-button",
  },
  async execute(interaction, client) {
    const tempDoc = await Temp.findOne({ tempValueOne: "app-review" });
    if (!tempDoc) {
      await interaction.reply({
        content: `The buttons have been disabled. Please run /review again.`,
        ephemeral: true,
      });
      return;
    }
    const config = await Config.findOne({ guildID: interaction.guild.id });
    const logChannel = client.channels.cache.get(config.logChannelID);
    const user = tempDoc.tempValueTwo;
    const interactionUser = tempDoc.tempValueThree;
    const app = await App.findOne({ userID: user });
    const missedMatches = app.missedMatches + 1;

    if (interaction.user.id !== interactionUser) {
      interaction.reply({
        content: `You are not the one who called /review`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const mongoClient = new MongoClient(databaseToken);

    const myDB = mongoClient.db("test");
    const appColl = myDB.collection("applications");
    const filter = { userID: user };

    const updateDocument = {
      $set: {
        missedMatches: missedMatches,
      },
    };
    await appColl.updateOne(filter, updateDocument);
    await interaction.editReply({
      content: `Added a missed match to <@${user}>. They are now at ${missedMatches}`,
    });
    await logChannel.send(
      `Added a missed match to <@${user}> by ${interaction.user.tag}, bringing their total to ${missedMatches}.`
    );
  },
};
