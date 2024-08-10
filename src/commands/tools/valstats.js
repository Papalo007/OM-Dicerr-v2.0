const { SlashCommandBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const puppeteer = require("puppeteer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("valstats")
    .setDescription("Returns the statistics of the provided user in Valorant.")
    .setDMPermission(false),
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.reply({
        content: `You haven't set up the proper channels yet! Do /config.`,
      });
      return;
    }
    if (config.botCommandsChannel) {
      const channel = client.channels.cache.get(config.botCommandsChannel);
      if (channel !== interaction.channel) {
        await interaction.reply({
          content: `You cannot use commands in this channel`,
          ephemeral: true,
        });
        return;
      }
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://example.com");
    await page.screenshot({ path: "example.png" });
  },
};
