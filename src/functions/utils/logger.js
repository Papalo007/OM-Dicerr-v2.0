const fs = require("fs").promises;
const path = require("path");

function getLocalTimestamp() {
  const now = new Date();

  const options = {
    timeZone: "Europe/Athens",
    hour12: false,
  };

  const local = new Date(now.toLocaleString("en-GB", options));

  const day = String(local.getDate()).padStart(2, "0");
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const year = local.getFullYear();

  const hours = String(local.getHours()).padStart(2, "0");
  const minutes = String(local.getMinutes()).padStart(2, "0");
  const seconds = String(local.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

async function logEvent(client, message, dm) {
  const userId = "706547981184270428";
  const timestamp = getLocalTimestamp();
  if (!message) message = "Starting up [+]";
  const logMessage = `[${timestamp}]  ${message}\n`;

  // Append to logs.txt
  await fs.appendFile(path.join(__dirname, "../../logs.txt"), logMessage);

  // DM
  if (dm && client) {
    try {
      const devUser = await client.users.fetch(userId);
      await devUser.send(`🚨 Bot Alert: ${message}`);
    } catch (error) {
      console.error("Failed to send DM: ", error);
      await fs.appendFile(path.join(__dirname, "../../logs.txt"), `Failed to DM: ${error}\n`);
    }
  }
}

module.exports = logEvent;
