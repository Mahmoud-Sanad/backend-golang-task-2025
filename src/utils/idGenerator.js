const { randomBytes } = require("crypto");

function generateId(serverId, len = 12) {
  const rnd = randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
  return `${serverId}_${rnd}`;
}

module.exports = { generateId };
