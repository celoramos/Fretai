const express = require('express');
const router = express.Router();
const { fretes, createRecord, updateRecord } = require('../data/store');

router.get('/', async (req, res) => {
  try {
    const { origem, destino, veiculo, status, motorista } = req.query;
    const CINCO_MINUTOS_MS = 5 * 60 * 1000;
    const agora = new Date();
    const fretesValidos = fretes.filter(frete => {
      const texto = (valor) => String(valor || '').toLowerCase();
      if (origem && !texto(frete.origem).includes(texto(origem))) return false;
      if (destino && !texto(frete.destino).includes(texto(destino))) return false;
      if (veiculo && !texto(frete.veiculo).includes(texto(veiculo))) return false;
      if (status && frete.status !== status) return false;
      if (motorista && !texto(frete.motoristaAceito?.nome).includes(texto(motorista))) return false;
      const timestampRef = frete.dataEntrega || frete.dataAceite;
      if (timestampRef && (agora - new Date(timestampRef) >= CINCO_MINUTOS_MS)) {
        return false;
      }
      return true;
    });

    res.json(fretesValidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nomeCarga, nomePessoa, telefoneContato, cep, endereco, cidade, estado, origem, destino } = req.body;
    
    if (!nomeCarga || !nomePessoa || !telefoneContato) {
      return res.status(400).json({ erro: "Por favor, preencha o nome da carga, responsável e telefone de contato." });
    }

    const novoFrete = createRecord({
      ...req.body,
      status: 'disponivel',
      data: req.body.data || new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    });
    fretes.push(novoFrete);
    res.status(201).json({
      mensagem: "Seu frete foi inserido no nosso sistema",
      frete: novoFrete
    });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/aceitar', async (req, res) => {
  try {
    const { motorista } = req.body;
    const frete = fretes.find((item) => item.id === req.params.id || item._id === req.params.id);
    if (frete) updateRecord(frete, { status: 'aceito', motoristaAceito: motorista, dataAceite: new Date() });
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/desistir', async (req, res) => {
  try {
    const frete = fretes.find((item) => item.id === req.params.id || item._id === req.params.id);
    if (frete) updateRecord(frete, { status: 'disponivel', motoristaAceito: null, dataAceite: null, dataEntrega: null });
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/concluir', async (req, res) => {
  try {
    const frete = fretes.find((item) => item.id === req.params.id || item._id === req.params.id);
    if (frete) updateRecord(frete, { status: 'entregue', dataEntrega: new Date() });
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const index = fretes.findIndex((item) => item.id === req.params.id || item._id === req.params.id);
    const frete = index >= 0 ? fretes.splice(index, 1)[0] : null;
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json({ mensagem: 'Frete removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
