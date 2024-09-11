const { InteractionType } = require("discord.js");
const Config = require("../../schemas/config");

module.exports = {
  name: "interactionCreate",
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const { commands } = client;
      const { commandName } = interaction;
      const command = commands.get(commandName);
      if (!command) return;

      if (interaction.isRepliable()) {
        try {
          if (command.data.name !== "setup" && command.data.name !== "purge") {
            const serverConfig = await Config.findOne({
              guildID: interaction.guild.id,
            });
            if (!serverConfig) {
              return await interaction.reply({
                content: `You haven't set up the proper channels yet! Do /setup.`,
                ephemeral: true,
              });
            }
            if (
              serverConfig.botCommandsChannel &&
              !serverConfig.botCommandsChannel.includes(interaction.channelId)
            ) {
              return await interaction.reply({
                content: `You cannot use commands in this channel!`,
                ephemeral: true,
              });
            }
          }
          await command.execute(interaction, client);
        } catch (error) {
          console.error(error);

          if (interaction.replied) {
            await interaction.followUp({
              content: `Something went wrong while executing this command. If you see this, please open a ticket in <#1223388941718257797>`,
              ephemeral: true,
            });
          } else {
            try {
              await interaction.deferReply({
                content: `Something went wrong while executing this command. If you see this, please open a ticket in <#1223388941718257797>`,
                ephemeral: true,
              });
            } catch (error) {
              await interaction.editReply({
                content: `Something went wrong while executing this command. If you see this, please open a ticket in <#1223388941718257797>`,
                ephemeral: true,
              });
            }
          }
        }
      } else {
        await command.execute(interaction, client);
      }
    } else if (interaction.isButton()) {
      const { buttons } = client;
      const { customId } = interaction;
      const button = buttons.get(customId);
      if (!button) return new Error("There is no code for this button :(");

      try {
        await button.execute(interaction, client);
      } catch (err) {
        console.error(err);
      }
    } else if (interaction.type == InteractionType.ModalSubmit) {
      const { modals } = client;
      const { customId } = interaction;
      const modal = modals.get(customId);
      if (!modal) return new Error("There is no code for this modal");

      try {
        await modal.execute(interaction, client);
      } catch (error) {
        console.error(error);
      }
    } else if (interaction.isContextMenuCommand()) {
      const { commands } = client;
      const { commandName } = interaction;
      const contextCommand = commands.get(commandName);
      if (!contextCommand) return;

      try {
        await contextCommand.execute(interaction, client);
      } catch (error) {
        console.error(error);
      }
    } else if (interaction.isStringSelectMenu()) {
      const { selectMenus } = client;
      const { customId } = interaction;
      const menu = selectMenus.get(customId);
      if (!menu) return new Error("There is no code for this select menu :(");

      try {
        await menu.execute(interaction, client);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
