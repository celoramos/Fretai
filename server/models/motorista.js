const mongoose = require('mongoose');

const motoristaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: false, lowercase: true, trim: true },
  senha: { type: String, required: false },
  telefone: { type: String, required: true },
  cnh: { type: String, required: true },
  veiculo: { type: String, required: true },
  cidade: { type: String, required: true },
  disponibilidade: { type: String, required: true },
  observacoes: { type: String },
  dataCadastro: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Motorista', motoristaSchema);