const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Frete = require('../models/frete');

function findFreteQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { id: id }] };
  }
  return { id: id };
}

router.get('/', async (req, res) => {
  try {
    const { origem, destino, veiculo, status, motorista } = req.query;
    const filter = {};

    if (origem) {
      filter.origem = { $regex: origem, $options: 'i' };
    }
    if (destino) {
      filter.destino = { $regex: destino, $options: 'i' };
    }
    if (veiculo) {
      filter.veiculo = { $regex: veiculo, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }
    if (motorista) {
      filter.motoristaAceito = { $regex: motorista, $options: 'i' };
    }

    const CINCO_MINUTOS_MS = 5 * 60 * 1000;
    const agora = new Date();

    let fretes = await Frete.find(filter).sort({ createdAt: -1 });

    const fretesValidos = fretes.filter(frete => {
      const timestampRef = frete.dataEntrega || frete.dataAceite;
      if (timestampRef && (agora - new Date(timestampRef) >= CINCO_MINUTOS_MS)) {
        return false;
      }
      return true;
    });

    res.json(fretesValidos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const novoFrete = new Frete({
      ...req.body,
      status: 'disponivel',
      data: req.body.data || new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    });
    await novoFrete.save();
    res.status(201).json(novoFrete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/aceitar', async (req, res) => {
  try {
    const { motorista } = req.body;
    const frete = await Frete.findOneAndUpdate(
      findFreteQuery(req.params.id),
      {
        status: 'aceito',
        motoristaAceito: motorista,
        dataAceite: new Date()
      },
      { new: true }
    );
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/desistir', async (req, res) => {
  try {
    const frete = await Frete.findOneAndUpdate(
      findFreteQuery(req.params.id),
      {
        status: 'disponivel',
        motoristaAceito: null,
        $unset: { dataAceite: 1, dataEntrega: 1 }
      },
      { new: true }
    );
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id/concluir', async (req, res) => {
  try {
    const frete = await Frete.findOneAndUpdate(
      findFreteQuery(req.params.id),
      {
        status: 'entregue',
        dataEntrega: new Date()
      },
      { new: true }
    );
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json(frete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const frete = await Frete.findOneAndDelete(findFreteQuery(req.params.id));
    if (!frete) return res.status(404).json({ erro: 'Frete não encontrado.' });
    res.json({ mensagem: 'Frete removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
