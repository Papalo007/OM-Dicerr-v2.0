const { SlashCommandBuilder } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Return my ping!")
    .setDMPermission(false),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      await interaction.reply({
        content: `You haven't set up the proper channels yet! Do /setup.`,
      });
      return;
    }
    if(config.botCommandsChannel && !botCommandsChannel.includes(interaction.channel.id)) {
      return interaction.reply({
        content: `You cannot use commands in this channel`,
        ephemeral: true,
      })
    }

    const message = await interaction.deferReply({
      fetchReply: true,
    });

    const newMessage = `API Latency: ${client.ws.ping}\nClient ping: ${
      message.createdTimestamp - interaction.createdTimestamp
    }`;
    await interaction.editReply({
      content: newMessage,
    });
  },
};
