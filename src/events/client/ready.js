module.exports = {
  name: "ready",
  once: true,
  async execute(client) {    
    setInterval(client.pickPresence, 5 * 60 * 1000);
    console.log(`${client.user.tag} is online and ready sir.`);
  },
};