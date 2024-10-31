module.exports = {
  name: "entitlementCreate",
  async execute(entitlement, client) {
    const dev = await client.users.fetch("706547981184270428");

    
    console.log(`${entitlement}\n\n${entitlement.skuId}`);
    
    try {
      await dev.send(entitlement);
    } catch (error) {
      await dev.send(entitlement.toString());
    }
  },
};
