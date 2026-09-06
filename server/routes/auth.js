const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { motoristas, createRecord, updateRecord } = require("../data/store");
const { JWT_SECRET } = require("../middleware/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha, telefone, cnh, veiculo, cidade, disponibilidade, observacoes } = req.body;

    if (!nome || !telefone || !cnh || !veiculo || !cidade) {
      return res.status(400).json({ erro: "Por favor, preencha todos os campos obrigatórios (Nome, Telefone, CNH, Veículo e Cidade)." });
    }

    const cnhLimpao = String(cnh).trim();
    const emailLimpao = email ? String(email).trim().toLowerCase() : undefined;

    let motoristaExistente = motoristas.find((item) => item.cnh === cnhLimpao);
    if (!motoristaExistente && emailLimpao) motoristaExistente = motoristas.find((item) => item.email === emailLimpao);

    if (motoristaExistente) {
      updateRecord(motoristaExistente, { nome, telefone, veiculo, cidade });
      if (disponibilidade) motoristaExistente.disponibilidade = disponibilidade;
      if (observacoes) motoristaExistente.observacoes = observacoes;
      if (emailLimpao) motoristaExistente.email = emailLimpao;

      if (senha) {
        const salt = await bcrypt.genSalt(10);
        motoristaExistente.senha = await bcrypt.hash(senha, salt);
      }

      const token = jwt.sign(
        { id: motoristaExistente._id, nome: motoristaExistente.nome, email: motoristaExistente.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const userObj = { ...motoristaExistente };
      delete userObj.senha;
      delete userObj.cnh;

      return res.json({
        mensagem: "Perfil atualizado e sessão iniciada com sucesso!",
        token,
        usuario: userObj
      });
    }

    let senhaHash = undefined;
    if (senha) {
      const salt = await bcrypt.genSalt(10);
      senhaHash = await bcrypt.hash(senha, salt);
    }

    const novoMotorista = createRecord({
      nome,
      email: emailLimpao,
      senha: senhaHash,
      telefone,
      cnh: cnhLimpao,
      veiculo,
      cidade,
      disponibilidade: disponibilidade || "Imediata",
      observacoes,
      dataCadastro: new Date().toLocaleDateString("pt-BR")
    });

    motoristas.push(novoMotorista);

    const token = jwt.sign(
      { id: novoMotorista._id, nome: novoMotorista.nome, email: novoMotorista.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = { ...novoMotorista };
    delete userObj.senha;
    delete userObj.cnh;

    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      token,
      usuario: userObj
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { login, email, cnh, telefone, senha } = req.body;
    const termoBusca = String(login || email || cnh || telefone || "").trim();

    if (!termoBusca) {
      return res.status(400).json({ erro: "Informe seu E-mail, CNH ou Telefone para entrar." });
    }

    const motorista = motoristas.find((item) => item.email === termoBusca.toLowerCase()
      || item.cnh === termoBusca
      || item.telefone === termoBusca);

    if (!motorista) {
      return res.status(404).json({ erro: "Nenhum motorista encontrado com esses dados." });
    }

    if (motorista.senha) {
      if (!senha) {
        return res.status(400).json({ erro: "Por favor, digite sua senha." });
      }
      const senhaValida = await bcrypt.compare(senha, motorista.senha);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta." });
      }
    }

    const token = jwt.sign(
      { id: motorista._id, nome: motorista.nome, email: motorista.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = { ...motorista };
    delete userObj.senha;
    delete userObj.cnh;

    return res.json({
      mensagem: `Bem-vindo(a) de volta, ${motorista.nome}!`,
      token,
      usuario: userObj
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
