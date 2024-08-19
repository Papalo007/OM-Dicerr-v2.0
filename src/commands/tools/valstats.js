const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Config = require("../../schemas/config");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("valstats")
    .setDescription("Returns the statistics of the provided user in Valorant.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The riot id of the user (Username#ID)")
        .setRequired(true)
    ),
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
    await interaction.deferReply();

    const target = interaction.options.getString("target");
    const targetInHex = replaceNonAlphanumericWithHex(target);
    const trackerLink = `https://tracker.gg/valorant/profile/riot/${targetInHex}/overview`;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(trackerLink);
    await page.screenshot({ path: "screenshotLol.png" }); //For troubleshooting

    let rank;
    let pRank;
    let dmr;
    let matches1;
    let matches2;
    let kd;
    let bestAgent;
    let secondBestAgent;
    let kd2;
    let dmr2;
    let hs;
    let kast;
    let win;
    let win2;
    let win1;
    let dmr1;
    let kd1;
    let mode;
    let rankImgLink;
    let embed;

    try {
      mode = await page
        .locator("css=li.multi-switch__item--selected span")
        .nth(0)
        .textContent();
    } catch (error) {
      console.log(error);
      try {
        let elements = await page.locator("h1").textContent();
        if (elements === "404") {
          await interaction.editReply({
            content: `404\nCouldn't find the player "${target}"`,
            ephemeral: true,
          });
          return;
        } else if (elements === "tracker.gg") {
          await interaction.editReply({
            content: `The bot couldn't get past the human verification check.`,
            ephemeral: true,
          });
          return;
        } else {
          await interaction.editReply({
            content: `An unknown error occurred while trying to gather information about this player. Please check the bot terminal for further information.`,
          });
          console.log("An unknown error occurred");
        }
      } catch (error) {
        let elements = await page.locator("css=span.font-light").textContent();
        if (elements.toLowerCase().includes("profile is private")) {
          await interaction.editReply({
            content: `${target}'s profile is private, so I cannot access any information regarding this player :(`,
          });
          return;
        }
      }
    }

    if (mode === "Competitive") {
      rank = await page
        .locator(
          'css=div[class="rating-summary__content"] div.rating-entry div.value'
        )
        .textContent();
      pRank = await page
        .locator(
          "css=div.rating-summary__content.rating-summary__content--secondary div.rating-entry div.value"
        )
        .textContent();
      rankImgLink = await page
        .locator(
          'css=div[class="rating-summary__content"] div.rating-entry__rank-icon img'
        )
        .getAttribute("src");
    }

    const episode = await page
      .locator("css=li.multi-switch__item--selected span")
      .nth(1)
      .textContent();

    const name = await page
      .locator("css=span.trn-ign__username")
      .first()
      .textContent();
    let discriminator = await page
      .locator("css=span.trn-ign__discriminator")
      .first()
      .textContent();
    discriminator = discriminator.slice(1);

    dmr = await page
      .locator(
        "css=div.giant:nth-child(1) > div:nth-child(1) > div:nth-child(2) > span:nth-child(1)"
      )
      .textContent();
    hs = await page
      .locator(
        "css=div.giant:nth-child(3) > div:nth-child(1) > div:nth-child(2) > span:nth-child(2) > span:nth-child(1)"
      )
      .textContent();
    win = await page
      .locator(
        "css=div.giant:nth-child(4) > div:nth-child(1) > div:nth-child(2) > span:nth-child(2) > span:nth-child(1)"
      )
      .textContent();
    kd = await page
      .locator(
        "css=div.giant:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span:nth-child(2) > span:nth-child(1)"
      )
      .textContent();
    kast = await page
      .locator(
        ".main > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span:nth-child(2) > span:nth-child(1)"
      )
      .textContent();

    bestAgent = await page
      .locator(
        "css=div.st-content__item:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)"
      )
      .textContent();
    matches1 = await page
      .locator(
        "css=div.st-content__item-value--highlight:nth-child(2) > div:nth-child(1) > div:nth-child(1)"
      )
      .textContent();
    win1 = await page
      .locator(
        "css=div.st-content__item:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1)"
      )
      .textContent();
    dmr1 = await page
      .locator(
        "css=div.st-content__item:nth-child(1) > div:nth-child(5) > div:nth-child(1) > div:nth-child(1)"
      )
      .textContent();
    kd1 = await page
      .locator(
        "css=div.st-content__item:nth-child(1) > div:nth-child(4) > div:nth-child(1) > div:nth-child(1)"
      )
      .textContent();

    try {
      secondBestAgent = await page
        .locator(
          "css=div.st-content__item:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)"
        )
        .textContent();
      matches2 = await page
        .locator(
          "css=div.st-content__item:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)"
        )
        .textContent();
      win2 = await page
        .locator(
          "css=div.st-content__item-value--highlight:nth-child(3) > div:nth-child(1) > div:nth-child(1)"
        )
        .textContent();
      kd2 = await page
        .locator(
          "css=div.st-content__item-value--highlight:nth-child(4) > div:nth-child(1) > div:nth-child(1)"
        )
        .textContent();
      dmr2 = await page
        .locator(
          "css=div.st-content__item-value--highlight:nth-child(5) > div:nth-child(1) > div:nth-child(1)"
        )
        .textContent();

      embed = new EmbedBuilder()
        .setAuthor({
          name: "Moderator Dicerr",
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setTitle(`${name}${discriminator}'s Valorant statistics`)
        .setURL(trackerLink)
        .setDescription(`${mode} overview of ${episode}`)
        .addFields(
          {
            name: "Dmg/Round",
            value: dmr,
            inline: true,
          },
          {
            name: "K/D",
            value: kd,
            inline: true,
          },
          {
            name: "HS %",
            value: hs,
            inline: true,
          },
          {
            name: "KAST",
            value: kast,
            inline: true,
          },
          {
            name: "Win %",
            value: win,
            inline: true,
          },
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
          {
            name: "Dmg/Round",
            value: dmr1,
            inline: true,
          },
          {
            name: "K/D",
            value: kd1,
            inline: true,
          },
          {
            name: "Win %",
            value: win1,
            inline: true,
          },
          {
            name: "__Second Most Played Agent__",
            value: `${secondBestAgent} (${matches2} matches)\n\n__Statistics with ${secondBestAgent}:__`,
            inline: false,
          },
          {
            name: "Dmg/Round",
            value: dmr2,
            inline: true,
          },
          {
            name: "K/D",
            value: kd2,
            inline: true,
          },
          {
            name: "Win %",
            value: win2,
            inline: true,
          }
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
        .setURL(trackerLink)
        .setDescription(`${mode} overview of ${episode}`)
        .addFields(
          {
            name: "Dmg/Round",
            value: dmr,
            inline: true,
          },
          {
            name: "K/D",
            value: kd,
            inline: true,
          },
          {
            name: "HS %",
            value: hs,
            inline: true,
          },
          {
            name: "KAST",
            value: kast,
            inline: true,
          },
          {
            name: "Win %",
            value: win,
            inline: true,
          },
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
          {
            name: "Dmg/Round",
            value: dmr1,
            inline: true,
          },
          {
            name: "K/D",
            value: kd1,
            inline: true,
          },
          {
            name: "Win %",
            value: win1,
            inline: true,
          }
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

function replaceNonAlphanumericWithHex(input) {
  return input.replace(/[^A-Za-z0-9]/g, (match) => {
    return "%" + match.charCodeAt(0).toString(16).toUpperCase();
  });
}
