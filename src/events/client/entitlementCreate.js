module.exports = {
  name: "entitlementCreate",
  async execute(entitlement, client) {
    console.log(
      "entitlementCreate event received and thingy executed eehehehhehehee"
    );
    const dev = await client.users.fetch("706547981184270428");
    const user = await client.users.fetch(entitlement.userId);
    const sku = client.application.entitlements.cache.find(
      ({ skuId }) => skuId === entitlement.skuId
    );

    const message = `# ----------------------\n# Purchase complete!\nSKU Name: ${sku.name}, SKU ID: ${entitlement.skuId}
Starts at: ${entitlement.startsAt}, Ends at: ${entitlement.endsAt}\nConsumed: ${entitlement.consumed}, Entitlement ID: ${entitlement.id}
User's tag: ${user.tag}, ID: ${entitlement.userId}`;

    if (entitlement.isGuildSubscription) {
      message += "\nGuild Subscription";
    } else if (entitlement.isUserSubscription) {
      message += "\nUser Subscription";
    }

    await dev.send(message).catch(console.error);

    //TODO: Add a switch statement to send the user who bought this thing a message + their privileges.
  },
};
