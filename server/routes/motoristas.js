const express = require('express');
const router = express.Router();
const Motorista = require('../models/motorista');

router.get('/', async (req, res) => {
  try {
    const motoristas = await Motorista.find().select('-cnh').sort({ createdAt: -1 });
    res.json(motoristas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const novoMotorista = new Motorista({
      ...req.body,
      dataCadastro: req.body.dataCadastro || new Date().toLocaleDateString('pt-BR')
    });
    await novoMotorista.save();
    res.status(201).json(novoMotorista);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const motorista = await Motorista.findById(req.params.id).select('-cnh');
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado.' });
    res.json(motorista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
