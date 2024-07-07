const { MongoClient, ServerApiVersion } = require("mongodb");
const { databaseToken } = process.env;

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    const mongoClient = new MongoClient(databaseToken, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    const myDB = mongoClient.db("test");
    await myDB.collection("temp").deleteMany({});
    console.log('Cleared database collection "temp"');

    setInterval(client.pickPresence, 5 * 60 * 1000);
    console.log(`${client.user.tag} is online and ready sir.`);
  },
};
