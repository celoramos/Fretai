const express = require('express');
const router = express.Router();
const { motoristas, createRecord } = require('../data/store');

router.get('/', async (req, res) => {
  try {
    res.json(motoristas.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(({ cnh, ...motorista }) => motorista));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const novoMotorista = createRecord({
      ...req.body,
      dataCadastro: req.body.dataCadastro || new Date().toLocaleDateString('pt-BR')
    });
    motoristas.push(novoMotorista);
    res.status(201).json(novoMotorista);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const motorista = motoristas.find((item) => item.id === req.params.id || item._id === req.params.id);
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado.' });
    const { cnh, ...motoristaPublico } = motorista;
    res.json(motoristaPublico);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
