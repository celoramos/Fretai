const { randomUUID } = require("crypto");

const fretes = [];
const motoristas = [];
const usuarios = [];

function createRecord(data) {
  const now = new Date();
  const id = randomUUID();
  return { ...data, id, _id: id, createdAt: now, updatedAt: now };
}

function updateRecord(record, changes) {
  Object.assign(record, changes, { updatedAt: new Date() });
  return record;
}

function removeExpiredFretes() {
  const limit = Date.now() - 5 * 60 * 1000;
  const remaining = fretes.filter((frete) => {
    const timestamp = frete.dataEntrega || frete.dataAceite;
    return !timestamp || new Date(timestamp).getTime() > limit;
  });
  const removed = fretes.length - remaining.length;
  fretes.splice(0, fretes.length, ...remaining);
  return removed;
}

module.exports = { fretes, motoristas, usuarios, createRecord, updateRecord, removeExpiredFretes };