const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("valstats-id")
    .setDescription("Returns the statistics of the provided user in Valorant.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The riot id of the user (Username#ID)")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const config = await Config.findOne({ guildID: interaction.guild.id });
    if (!config) {
      return interaction.reply({
        content: `You haven't set up the proper channels yet! Do /setup.`,
      });
    }
    if(config.botCommandsChannel && !config.botCommandsChannel.includes(interaction.channel.id)) {
      return interaction.reply({
        content: `You cannot use commands in this channel`,
        ephemeral: true,
      })
    }

    await interaction.deferReply();
    const target = interaction.options.getString("target");
    const targetInHex = target.replace(/#/g, "%23").replace(/ /g, "%20");
    const trackerLink = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(trackerLink);
    await page.screenshot({ path: "screenshotLol.png" }); //For troubleshooting

    let rank = "N ";
    let pRank = "A";
    let rankImgLink = "https://images.1v9.gg/unrankedfix-9535dccc99d8.webp";
    let mode;
    let embed;
    let episode;

    await page.waitForTimeout(1000);

    const elementExists = await page
      .locator("css=li.multi-switch__item--selected span")
      .nth(0)
      .count();
    if (elementExists) {
      mode = await page
        .locator("css=li.multi-switch__item--selected span")
        .nth(0)
        .textContent();
      if (mode === "PC" || mode === "Console") {
        mode = await page
          .locator("css=li.multi-switch__item--selected span")
          .nth(1)
          .textContent();
        episode = await page
          .locator("css=li.multi-switch__item--selected span")
          .nth(2)
          .textContent();
      } else {
        episode = await page
          .locator("css=li.multi-switch__item--selected span")
          .nth(1)
          .textContent();

        if (mode === "Premier") {
          await page.getByText("Competitive").first().click();
          checkForErrors(target, page, interaction);
        }
      }
    } else {
      checkForErrors(target, page, interaction);
    }

    if (mode === "Competitive") {
      //prettier-ignore
      [rank, pRank, rankImgLink] = await Promise.all([
        page.locator('css=div[class="rating-summary__content"] div.rating-entry div.value').textContent(),
        page.locator("css=div.rating-summary__content.rating-summary__content--secondary div.rating-entry div.value").textContent(),
        page.locator('css=div[class="rating-summary__content"] div.rating-entry__rank-icon img').getAttribute("src"),
      ]);
    }

    //prettier-ignore
    const [ name, discriminator] = await Promise.all([
      page.locator("css=span.trn-ign__username").first().textContent(),
      page.locator("css=span.trn-ign__discriminator").first().textContent().then((d) => d.slice(1)),
    ]);

    //Giant Stats
    //prettier-ignore
    const [dmr, hs, win, kd] = await Promise.all([
      page.locator('css=div.giant-stats [title="Damage/Round"] + span').textContent(),
      page.locator('css=div.giant-stats [title="Headshot %"] + span').textContent(),
      page.locator('css=div.giant-stats [title="Win %"] + span').textContent(),
      page.locator('css=div.giant-stats [title="K/D Ratio"] + span').textContent(),
    ]);

    //Main
    const kast = await page
      .locator('css=div.main div.numbers [title="KAST"] + span span.value')
      .textContent();

    //Agents
    //prettier-ignore
    const [bestAgent, matches1, win1, dmr1, kd1] = await Promise.all([
      page.locator("css=div.st-content__item:nth-child(1) div.info div.value").first().textContent(),
      page.locator("css=div.st-content__item:nth-child(1) div.info div.value").nth(1).textContent(),
      page.locator("css=div.st-content__item:nth-child(1) div.info div.value").nth(2).textContent(),
      page.locator("css=div.st-content__item:nth-child(1) div.info div.value").nth(4).textContent(),
      page.locator("css=div.st-content__item:nth-child(1) div.info div.value").nth(3).textContent(),
    ]);

    try {
      //prettier-ignore
      const [secondBestAgent, matches2, win2, kd2, dmr2] = await Promise.all([
        page.locator("css=div.st-content__item:nth-child(3) div.info div.value").first().textContent(),
        page.locator("css=div.st-content__item:nth-child(3) div.info div.value").nth(1).textContent(),
        page.locator("css=div.st-content__item:nth-child(3) div.info div.value").nth(2).textContent(),
        page.locator("css=div.st-content__item:nth-child(3) div.info div.value").nth(3).textContent(),
        page.locator("css=div.st-content__item:nth-child(3) div.info div.value").nth(4).textContent(),
      ]);

      embed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicerr",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(`${name}${discriminator}'s Valorant statistics`)
        .setURL(page.url())
        .setDescription(`${mode} overview of ${episode}`)
        .addFields(
          { name: "Dmg/Round", value: dmr, inline: true },
          { name: "K/D", value: kd, inline: true },
          { name: "HS %", value: hs, inline: true },
          { name: "KAST", value: kast, inline: true },
          { name: "Win %", value: win, inline: true },
          {
            name: "Current/Peak Rank",
            value: `${rank}/ ${pRank}`,
            inline: true,
          },
          {
            name: "__Most Played Agent__",
            value: `${bestAgent} (${matches1} matches)\n\n__Statistics with ${bestAgent}:__`,
            inline: false,
          },
          { name: "Dmg/Round", value: dmr1, inline: true },
          { name: "K/D", value: kd1, inline: true },
          { name: "Win %", value: win1, inline: true },
          {
            name: "__Second Most Played Agent__",
            value: `${secondBestAgent} (${matches2} matches)\n\n__Statistics with ${secondBestAgent}:__`,
            inline: false,
          },
          { name: "Dmg/Round", value: dmr2, inline: true },
          { name: "K/D", value: kd2, inline: true },
          { name: "Win %", value: win2, inline: true }
        )
        .setColor("#ff8000")
        .setFooter({
          text: "Valorant Stats by Dicerr",
          iconURL:
            "https://toppng.com/uploads/preview/valorant-logo-icon-11608279985p9bg0vbcxu.png",
        })
        .setThumbnail(rankImgLink)
        .setTimestamp();
    } catch (error) {
      console.log(error);

      embed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicerr",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(`${name}${discriminator}'s Valorant statistics`)
        .setURL(page.url())
        .setDescription(`${mode} overview of ${episode}`)
        .addFields(
          { name: "Dmg/Round", value: dmr, inline: true },
          { name: "K/D", value: kd, inline: true },
          { name: "HS %", value: hs, inline: true },
          { name: "KAST", value: kast, inline: true },
          { name: "Win %", value: win, inline: true },
          {
            name: "Current/Peak Rank",
            value: `${rank}/ ${pRank}`,
            inline: true,
          },
          {
            name: "__Most Played Agent__",
            value: `${bestAgent} (${matches1} matches)\n\n__Statistics with ${bestAgent}:__`,
            inline: false,
          },
          { name: "Dmg/Round", value: dmr1, inline: true },
          { name: "K/D", value: kd1, inline: true },
          { name: "Win %", value: win1, inline: true }
        )
        .setColor("#ff8000")
        .setFooter({
          text: "Valorant Stats by Dicerr",
          iconURL:
            "https://toppng.com/uploads/preview/valorant-logo-icon-11608279985p9bg0vbcxu.png",
        })
        .setThumbnail(rankImgLink)
        .setTimestamp();
    }

    await browser.close();
    await interaction.editReply({
      embeds: [embed],
    });
  },
};

async function checkForErrors(target, page, interaction) {
  let elementExists2 = await page.locator("h1").count();
  if (elementExists2) {
    let elements = await page.locator("h1").textContent();
    if (elements === "404") {
      return await interaction.editReply({
        content: `404\nCouldn't find the player "${target}"`,
        ephemeral: true,
      });
    } else if (elements === "tracker.gg") {
      return await interaction.editReply({
        content: `The bot couldn't get past the human verification check.`,
        ephemeral: true,
      });
    } else if (elements.toLowerCase() === "bad request") {
      return await interaction.editReply({
        content: `Bad Request.`,
        ephemeral: false,
      });
    } else {
      console.log("An unknown error occurred");
      return await interaction.editReply({
        content: `An unknown error occurred while trying to gather information about this player. Please check the bot terminal for further information.`,
      });
    }
  } else {
    let elements = await page.locator("css=span.font-light").textContent();
    if (elements.toLowerCase().includes("profile is private")) {
      return await interaction.editReply({
        content: `${target}'s profile is private, so I cannot access any information regarding this player :(`,
      });
    } else {
      return await interaction.editReply({
        content: `An unknown error occurred. Please create a support ticket with a screenshot of this error message.\ntarget=${target}`,
      });
    }
  }
}
