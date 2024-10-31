const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { token } = process.env;

module.exports = {
  name: "entitlementCreate",
  async execute(entitlement, client) {
    const dev = await client.users.fetch("706547981184270428");
    const user = await client.users.fetch(entitlement.userId);
    try {
      const response = await fetch(
        `https://discord.com/api/v10/store/skus/${entitlement.skuId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        console.error(`Failed to fetch SKU details: ${response.statusText}`);

      const skuData = await response.json();

      console.log("SKU Details:", skuData);
      console.log("SKU Name:", skuData.name);

    } catch (error) {
      console.error("Error fetching SKU details:", error);
    }

    const message = `# ----------------------\n# Purchase complete!\nSKU Name: ${skuData.name}, SKU ID: ${entitlement.skuId}
Starts at: ${entitlement.startsAt}, Ends at: ${entitlement.endsAt}\nConsumed: ${entitlement.consumed}, Entitlement ID: ${entitlement.id}
User's tag: ${user.tag}, ID: ${entitlement.userId}`;

    if (entitlement.isGuildSubscription) {
      message += "\nGuild Subscription";
    } else if (entitlement.isUserSubscription) {
      message += "\nUser Subscription";
    }

    await dev.send(message);

    //TODO: Add a switch statement to send the user who bought this thing a message + their privileges.
  },
};
