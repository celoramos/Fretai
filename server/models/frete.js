const mongoose = require("mongoose");

const freteSchema = new mongoose.Schema(
  {
    nomeCarga: { type: String, required: true },
    nomePessoa: { type: String, required: true },
    telefoneContato: { type: String, required: true },
    origem: { type: String, required: true },
    destino: { type: String, required: true },
    data: { type: String },
    status: {
      type: String,
      enum: ["disponivel", "aceito", "entregue"],
      default: "disponivel",
    },
    motoristaAceito: {
      nome: String,
      telefone: String,
      veiculo: String,
    },
    dataAceite: { type: Date },
    dataEntrega: { type: Date },
  },
  { timestamps: true },
);

freteSchema.index(
  { dataAceite: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { status: "aceito" } },
);
freteSchema.index(
  { dataEntrega: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { status: "entregue" } },
);

module.exports = mongoose.model("Frete", freteSchema);
