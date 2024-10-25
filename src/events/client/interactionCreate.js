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

      const teamModuleCommands = [
        "apply",
        "recruit",
        "sack",
        "review",
        "wipe-apps",
      ];

      if (interaction.isRepliable()) {
        try {
          const serverConfig = await Config.findOne({
            guildID: interaction.guild.id,
          });
          if (command.data.name !== "setup" && command.data.name !== "purge") {
            if (!serverConfig) {
              return await interaction.reply({
                content: `You haven't set up the proper channels yet! Do /setup.`,
                ephemeral: true,
              });
            }
            if (
              serverConfig.botCommandsChannel &&
              !serverConfig.botCommandsChannel.includes(
                interaction.channelId
              ) &&
              command.data.name !== "apply"
            ) {
              return await interaction.reply({
                content: `You cannot use commands in this channel!`,
                ephemeral: true,
              });
            }
          }
          if (
            serverConfig &&
            serverConfig.teamModule === "false" &&
            teamModuleCommands.includes(command.data.name)
          ) {
            return await interaction.reply(
              "This is part of the team module which you have disabled. If you want to enable it, run the /setup command again."
            );
          }
          await command.execute(interaction, client);
        } catch (error) {
          console.error(error);

          if (interaction.replied) {
            await interaction.followUp({
              content: `Something went wrong while executing this command.`,
              ephemeral: true,
            });
          } else {
            try {
              await interaction.deferReply({
                content: `Something went wrong while executing this command.`,
                ephemeral: true,
              });
            } catch (error) {
              await interaction.editReply({
                content: `Something went wrong while executing this command.`,
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
    } else if (
      interaction.type === InteractionType.ApplicationCommandAutocomplete
    ) {
      const { commands } = client;
      const { commandName } = interaction;
      const command = commands.get(commandName);
      if (!command) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
