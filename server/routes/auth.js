const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { motoristas, usuarios, createRecord, updateRecord } = require("../data/store");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// --- REGISTRO DE MOTORISTAS ---
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha, telefone, cnh, veiculo, cidade, disponibilidade, observacoes, cpf } = req.body;

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
      if (cpf) motoristaExistente.cpf = cpf;

      if (senha) {
        const salt = await bcrypt.genSalt(10);
        motoristaExistente.senha = await bcrypt.hash(senha, salt);
      }

      const token = jwt.sign(
        { id: motoristaExistente._id, nome: motoristaExistente.nome, email: motoristaExistente.email, tipo: "motorista" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const userObj = { ...motoristaExistente, tipo: "motorista" };
      delete userObj.senha;
      delete userObj.cnh;

      return res.json({
        mensagem: "Perfil de motorista atualizado e sessão iniciada com sucesso!",
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
      cpf,
      veiculo,
      cidade,
      disponibilidade: disponibilidade || "Imediata",
      observacoes,
      tipo: "motorista",
      dataCadastro: new Date().toLocaleDateString("pt-BR")
    });

    motoristas.push(novoMotorista);

    const token = jwt.sign(
      { id: novoMotorista._id, nome: novoMotorista.nome, email: novoMotorista.email, tipo: "motorista" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = { ...novoMotorista };
    delete userObj.senha;
    delete userObj.cnh;

    return res.status(201).json({
      mensagem: "Cadastro de motorista realizado com sucesso!",
      token,
      usuario: userObj
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// --- REGISTRO DE USUÁRIOS / CLIENTES ---
router.post("/register-user", async (req, res) => {
  try {
    const { nome, email, username, cpf, telefone, senha } = req.body;

    if (!nome || !email || !username || !cpf || !senha) {
      return res.status(400).json({ erro: "Por favor, preencha todos os campos obrigatórios para o cadastro de usuário." });
    }

    const emailLimpao = String(email).trim().toLowerCase();
    const usernameLimpao = String(username).trim().toLowerCase();
    const cpfNumerico = String(cpf).replace(/\D/g, "");

    const usuarioExistente = usuarios.find((u) => {
      const uCpfLimpao = String(u.cpf || "").replace(/\D/g, "");
      return (
        u.email === emailLimpao ||
        u.username === usernameLimpao ||
        (uCpfLimpao && uCpfLimpao === cpfNumerico)
      );
    });

    if (usuarioExistente) {
      return res.status(400).json({ erro: "Já existe uma conta cadastrada com este E-mail, Nome de Usuário ou CPF." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoUsuario = createRecord({
      nome: String(nome).trim(),
      email: emailLimpao,
      username: usernameLimpao,
      cpf,
      telefone: telefone ? String(telefone).trim() : "",
      senha: senhaHash,
      tipo: "cliente",
      dataCadastro: new Date().toLocaleDateString("pt-BR")
    });

    usuarios.push(novoUsuario);

    const token = jwt.sign(
      { id: novoUsuario._id, nome: novoUsuario.nome, email: novoUsuario.email, tipo: "cliente" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = { ...novoUsuario };
    delete userObj.senha;

    return res.status(201).json({
      mensagem: `Usuário ${novoUsuario.nome} cadastrado com sucesso!`,
      token,
      usuario: userObj
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// --- LOGIN UNIFICADO ---
router.post("/login", async (req, res) => {
  try {
    const { login, cpf, email, cnh, telefone, senha } = req.body;
    const termoBusca = String(login || cpf || email || cnh || telefone || "").trim();
    const cpfNumerico = String(cpf || login || "").replace(/\D/g, "");

    if (!termoBusca) {
      return res.status(400).json({ erro: "Informe seu Usuário, CPF, E-mail ou Telefone para entrar." });
    }

    // Busca primeiro nos motoristas e depois nos usuarios (clientes)
    let contaEncontrada = motoristas.find((item) => {
      const itemCpfLimpao = String(item.cpf || "").replace(/\D/g, "");
      return (
        (item.email && item.email.toLowerCase() === termoBusca.toLowerCase()) ||
        (item.username && item.username.toLowerCase() === termoBusca.toLowerCase()) ||
        (item.nome && item.nome.toLowerCase() === termoBusca.toLowerCase()) ||
        (item.cnh && item.cnh === termoBusca) ||
        (item.telefone && item.telefone === termoBusca) ||
        (itemCpfLimpao && cpfNumerico && itemCpfLimpao === cpfNumerico)
      );
    });

    if (!contaEncontrada) {
      contaEncontrada = usuarios.find((item) => {
        const itemCpfLimpao = String(item.cpf || "").replace(/\D/g, "");
        return (
          (item.email && item.email.toLowerCase() === termoBusca.toLowerCase()) ||
          (item.username && item.username.toLowerCase() === termoBusca.toLowerCase()) ||
          (item.nome && item.nome.toLowerCase() === termoBusca.toLowerCase()) ||
          (item.telefone && item.telefone === termoBusca) ||
          (itemCpfLimpao && cpfNumerico && itemCpfLimpao === cpfNumerico)
        );
      });
    }

    if (!contaEncontrada) {
      return res.status(404).json({ erro: "Nenhum usuário ou motorista encontrado com esses dados." });
    }

    if (contaEncontrada.senha) {
      if (!senha) {
        return res.status(400).json({ erro: "Por favor, digite sua senha." });
      }
      const senhaValida = await bcrypt.compare(senha, contaEncontrada.senha);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta." });
      }
    }

    const token = jwt.sign(
      { id: contaEncontrada._id, nome: contaEncontrada.nome, email: contaEncontrada.email, tipo: contaEncontrada.tipo || "cliente" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = { ...contaEncontrada };
    delete userObj.senha;
    delete userObj.cnh;

    return res.json({
      mensagem: `Bem-vindo(a) de volta, ${contaEncontrada.nome}!`,
      token,
      usuario: userObj
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
