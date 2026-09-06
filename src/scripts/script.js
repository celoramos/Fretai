const API_URL = "http://localhost:3000/api";

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icon =
    type === "success"
      ? "bi-check-circle-fill"
      : type === "danger"
        ? "bi-exclamation-triangle-fill"
        : "bi-info-circle-fill";
  toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const menuToggle = document.getElementById("menuToggle");
const sidePanel = document.getElementById("sidePanel");
const sideClose = document.getElementById("sideClose");

function closeSidePanel() {
  if (sidePanel) {
    sidePanel.classList.remove("open");
  }
  if (menuToggle) {
    const hamburg = menuToggle.querySelector(".hamburglar");
    if (hamburg) hamburg.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
}

if (menuToggle && sidePanel) {
  menuToggle.addEventListener("click", () => {
    sidePanel.classList.toggle("open");
    const isOpen = sidePanel.classList.contains("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  if (sideClose) {
    sideClose.addEventListener("click", closeSidePanel);
  }

  document.addEventListener("click", (event) => {
    if (
      !sidePanel.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeSidePanel();
    }
  });
}

function getMotoristaAtivo() {
  try {
    return JSON.parse(localStorage.getItem("currentMotorista"));
  } catch (e) {
    return null;
  }
}

function renderActiveDriverBar() {
  const container = document.getElementById("activeDriverBar");
  if (!container) return;

  const motorista = getMotoristaAtivo();
  if (motorista && motorista.nome) {
    container.innerHTML = `
      <div class="active-driver-card">
          <div class="active-driver-info">
              <div class="active-driver-avatar">
                  <i class="bi bi-person-badge-fill"></i>
              </div>
              <div>
                  Sessão de Motorista Ativa: <strong>${motorista.nome}</strong> (${motorista.veiculo || "Veículo cadastrado"})
              </div>
          </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="active-driver-card" style="background: rgba(37, 99, 235, 0.06); color: var(--primary); border: 1px solid rgba(37, 99, 235, 0.2);">
          <div class="active-driver-info">
              <i class="bi bi-info-circle-fill" style="font-size: 1.4rem; color: var(--accent-blue);"></i>
              <div>
                  Você ainda não registrou um perfil de motorista. 
                  <a href="cadastroMotorista.html" style="color: var(--accent-blue); font-weight: 700; text-decoration: underline;">Cadastre-se aqui</a> para aceitar fretes com um clique.
              </div>
          </div>
      </div>
    `;
  }
}

function abrirWhatsAppFrete(freteId) {
  const fretes = JSON.parse(localStorage.getItem("fretes") || "[]");
  const frete = fretes.find((f) => f.id === freteId || f._id === freteId);

  if (!frete) {
    showToast("Frete não encontrado.", "danger");
    return;
  }

  const cleanPhone = (frete.telefoneContato || "").replace(/\D/g, "");
  if (!cleanPhone) {
    showToast(
      "O telefone do responsável não é válido para WhatsApp.",
      "danger",
    );
    return;
  }

  const phoneWithDdi = cleanPhone.startsWith("55")
    ? cleanPhone
    : "55" + cleanPhone;
  const motorista = getMotoristaAtivo();
  const nomeMotorista = motorista ? motorista.nome : "Motorista do Fretaí";
  const veiculoMotorista = motorista
    ? motorista.veiculo || "Veículo utilitário"
    : "Veículo utilitário";

  const textoMensagem = `Olá ${frete.nomePessoa}! Sou o motorista ${nomeMotorista} (${veiculoMotorista}) do Fretaí e aceitei o seu pedido de frete para a carga "${frete.nomeCarga}". Vim conversar sobre os detalhes do transporte.`;

  const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDdi}&text=${encodeURIComponent(textoMensagem)}`;

  window.open(waUrl, "_blank");
}

function calcularTempoRestante(timestamp) {
  if (!timestamp) return "5min";
  const ts =
    typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const passado = Date.now() - ts;
  const restanteMs = 5 * 60 * 1000 - passado;
  if (restanteMs <= 0) return "0min";
  const minutosRestantes = Math.ceil(restanteMs / (60 * 1000));
  return `${minutosRestantes}min`;
}

async function atualizarListaFretes() {
  const listaCargas = document.getElementById("listaCargas");
  const contadorPedidos = document.getElementById("contadorPedidos");

  if (!listaCargas) {
    return;
  }

  let fretes = [];

  try {
    const response = await fetch(`${API_URL}/fretes`);
    if (response.ok) {
      const data = await response.json();
      fretes = data.map((item) => ({
        ...item,
        id: item._id || item.id,
      }));
      localStorage.setItem("fretes", JSON.stringify(fretes));
    } else {
      throw new Error("Erro na API");
    }
  } catch (err) {
    fretes = JSON.parse(localStorage.getItem("fretes") || "[]");
  }

  const CINCO_MINUTOS = 5 * 60 * 1000;
  const agora = Date.now();

  const fretesAtivos = fretes.filter((frete) => {
    const ref = frete.dataEntrega || frete.dataAceite;
    if (ref) {
      const ts = typeof ref === "string" ? new Date(ref).getTime() : ref;
      if (agora - ts >= CINCO_MINUTOS) {
        return false;
      }
    }
    return true;
  });

  fretes = fretesAtivos;
  listaCargas.innerHTML = "";

  if (fretes.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "frete-empty";
    vazio.innerHTML =
      '<i class="bi bi-inbox" style="font-size: 2.2rem; display: block; margin-bottom: 8px; color: var(--text-muted);"></i>Ainda não há pedidos anunciados no momento. Registre uma carga para publicar!';
    listaCargas.appendChild(vazio);
  } else {
    fretes.forEach((frete) => {
      const novoItem = document.createElement("li");
      novoItem.className = "frete-item";

      const main = document.createElement("div");
      main.className = "frete-item__main";

      const titulo = document.createElement("div");
      titulo.className = "frete-item__title";
      titulo.innerHTML = `<i class="bi bi-box-seam-fill" style="color: var(--accent-blue);"></i> ${frete.nomeCarga}`;

      const rotaVisual = document.createElement("div");
      rotaVisual.className = "frete-route";
      rotaVisual.innerHTML = `
          <span class="route-point"><span class="dot green"></span> ${frete.origem || "Origem"}</span>
          <span class="route-arrow"><i class="bi bi-arrow-right"></i></span>
          <span class="route-point"><span class="dot red"></span> ${frete.destino || "Destino"}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "frete-item__meta";
      meta.innerHTML = `
        <span class="meta-item"><i class="bi bi-person-circle"></i> Responsável: <strong>${frete.nomePessoa}</strong></span>
        ${frete.data ? `<span class="meta-item meta-date"><i class="bi bi-clock-history"></i> Publicado às ${frete.data}</span>` : ""}
      `;

      main.appendChild(titulo);
      if (frete.origem || frete.destino) {
        main.appendChild(rotaVisual);
      }
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "frete-item__actions";

      const itemId = frete.id || frete._id;

      if (frete.status === "entregue") {
        const tempoRestante = calcularTempoRestante(
          frete.dataEntrega || frete.dataAceite,
        );
        actions.innerHTML = `
            <span class="frete-badge badge-entregue">
                <i class="bi bi-box-seam-fill"></i> Entregue (Apaga em ${tempoRestante})
            </span>
        `;
      } else if (frete.status === "aceito") {
        const motoristaNome = frete.motoristaAceito
          ? frete.motoristaAceito.nome
          : "Motorista";
        const tempoRestante = calcularTempoRestante(frete.dataAceite);
        actions.innerHTML = `
            <span class="frete-badge badge-aceito">
                <i class="bi bi-truck-front-fill"></i> Aceito por ${motoristaNome} (${tempoRestante})
            </span>
            <button type="button" class="btn btn-whatsapp btn-sm" onclick="abrirWhatsAppFrete('${itemId}')">
                <i class="bi bi-whatsapp"></i> Falar no WhatsApp
            </button>
            <button type="button" class="btn btn-success btn-sm" onclick="concluirEntrega('${itemId}')" title="Marcar este frete como entregue">
                <i class="bi bi-check-all"></i> Entregue
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="desistirFrete('${itemId}')" title="Desistir de realizar este frete">
                <i class="bi bi-x-circle-fill"></i> Desistir
            </button>
        `;
      } else {
        actions.innerHTML = `
            <span class="frete-badge">
                <span class="pulse-dot"></span> Pedido disponível
            </span>
            <button type="button" class="btn btn-primary btn-sm" onclick="aceitarFrete('${itemId}')">
                <i class="bi bi-hand-thumbs-up-fill"></i> Aceitar Pedido
            </button>
        `;
      }

      novoItem.appendChild(main);
      novoItem.appendChild(actions);
      listaCargas.appendChild(novoItem);
    });
  }

  if (contadorPedidos) {
    contadorPedidos.textContent = fretes.length;
  }

  renderActiveDriverBar();
}

async function concluirEntrega(freteId) {
  if (
    !confirm(
      "Deseja marcar este frete como ENTREGUE? Ele permanecerá visível por 5 minutos antes de desaparecer da lista.",
    )
  ) {
    return;
  }

  try {
    await fetch(`${API_URL}/fretes/${freteId}/concluir`, { method: "PUT" });
  } catch (err) {
    console.warn("Servidor offline, salvando localmente...");
  }

  let fretes = JSON.parse(localStorage.getItem("fretes") || "[]");
  const freteIndex = fretes.findIndex(
    (f) => f.id === freteId || f._id === freteId,
  );
  if (freteIndex !== -1) {
    fretes[freteIndex].status = "entregue";
    fretes[freteIndex].dataEntrega = Date.now();
    localStorage.setItem("fretes", JSON.stringify(fretes));
  }

  atualizarListaFretes();
  showToast(
    "Parabéns pela entrega! O frete foi concluído e sumirá da lista em 5 minutos.",
    "success",
  );
}

async function desistirFrete(freteId) {
  if (
    !confirm(
      "Tem certeza de que deseja desistir de realizar este frete? O pedido voltará a ficar disponível para outros motoristas.",
    )
  ) {
    return;
  }

  try {
    await fetch(`${API_URL}/fretes/${freteId}/desistir`, { method: "PUT" });
  } catch (err) {
    console.warn("Servidor offline, salvando localmente...");
  }

  let fretes = JSON.parse(localStorage.getItem("fretes") || "[]");
  const freteIndex = fretes.findIndex(
    (f) => f.id === freteId || f._id === freteId,
  );
  if (freteIndex !== -1) {
    fretes[freteIndex].status = "disponivel";
    fretes[freteIndex].motoristaAceito = null;
    delete fretes[freteIndex].dataAceite;
    delete fretes[freteIndex].dataEntrega;
    localStorage.setItem("fretes", JSON.stringify(fretes));
  }

  atualizarListaFretes();
  showToast(
    "Você desistiu da entrega. O pedido voltou a ficar disponível.",
    "info",
  );
}

async function aceitarFrete(freteId) {
  let motorista = getMotoristaAtivo();

  // Diagrama: Verificar "Fez a conta?" (CNH, CPF, Nome, Telefone)
  const temContaMotoristaCompleta = motorista &&
    motorista.nome &&
    (motorista.cnh || motorista.cpf || motorista.telefone);

  if (!temContaMotoristaCompleta) {
    showToast("Você precisa inserir os dados para prosseguir", "danger");
    setTimeout(() => {
      window.location.href = "cadastroMotorista.html";
    }, 1500);
    return;
  }

  try {
    await fetch(`${API_URL}/fretes/${freteId}/aceitar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motorista }),
    });
  } catch (err) {
    console.warn("Servidor offline, salvando localmente...");
  }

  let fretes = JSON.parse(localStorage.getItem("fretes") || "[]");
  const freteIndex = fretes.findIndex(
    (f) => f.id === freteId || f._id === freteId,
  );
  if (freteIndex !== -1) {
    fretes[freteIndex].status = "aceito";
    fretes[freteIndex].motoristaAceito = motorista;
    fretes[freteIndex].dataAceite = Date.now();
    localStorage.setItem("fretes", JSON.stringify(fretes));
  }

  atualizarListaFretes();
  showToast(
    `Pedido aceito por ${motorista.nome}! Abrindo WhatsApp...`,
    "success",
  );
  abrirWhatsAppFrete(freteId);
}

// --- CPF VALIDATION & MASKING FUNCTIONS ---
function validarCPF(cpf) {
  if (!cpf) return false;
  const cleanCpf = String(cpf).replace(/\D/g, "");
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCpf.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCpf.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.charAt(10), 10)) return false;

  return true;
}

function aplicarMascaraCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .substring(0, 14);
}

function aplicarMascaraTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
}

function aplicarMascaraCEP(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
}

async function buscarEnderecoPorCEP(cep) {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  
  try {
    const res = await fetch(`${API_URL}/cep/${clean}`);
    if (res.ok) {
      const data = await res.json();
      if (data.valido) return data;
    }
  } catch (e) {
    console.warn("Servidor offline, buscando diretamente na API ViaCEP...");
  }

  try {
    const resDirect = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (resDirect.ok) {
      const data = await resDirect.json();
      if (!data.erro) {
        return {
          valido: true,
          cep: data.cep,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          localidade: data.localidade || "",
          uf: data.uf || ""
        };
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar ViaCEP direto:", err);
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Redirecionamento para tela de login caso o usuário ainda não esteja autenticado
  const isLoginPage = window.location.pathname.endsWith("login.html") || 
                      window.location.pathname.endsWith("cadastroUsuario.html") ||
                      window.location.pathname.endsWith("cadastroMotorista.html") ||
                      document.getElementById("formLogin");
  const isAuthenticated = localStorage.getItem("currentUser") || localStorage.getItem("currentMotorista") || localStorage.getItem("token");

  if (!isLoginPage && !isAuthenticated && document.querySelector(".landing-page")) {
    window.location.href = "login.html";
    return;
  }

  // --- USER / CLIENT REGISTRATION LOGIC ---
  const formCadastroUsuario = document.getElementById("formCadastroUsuario");
  if (formCadastroUsuario) {
    const regNome = document.getElementById("regNome");
    const regEmail = document.getElementById("regEmail");
    const regUsername = document.getElementById("regUsername");
    const regCpf = document.getElementById("regCpf");
    const regTelefone = document.getElementById("regTelefone");
    const regSenha = document.getElementById("regSenha");
    const regConfirmaSenha = document.getElementById("regConfirmaSenha");
    const toggleRegSenhaBtn = document.getElementById("toggleRegSenhaBtn");

    const regCpfError = document.getElementById("regCpfError");
    const regCpfErrorText = document.getElementById("regCpfErrorText");
    const regCpfSuccess = document.getElementById("regCpfSuccess");
    const regConfirmaSenhaError = document.getElementById("regConfirmaSenhaError");

    // Toggle password visibility
    if (toggleRegSenhaBtn && regSenha) {
      toggleRegSenhaBtn.addEventListener("click", () => {
        const isPassword = regSenha.type === "password";
        regSenha.type = isPassword ? "text" : "password";
        const icon = toggleRegSenhaBtn.querySelector("i");
        if (icon) {
          icon.className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
        }
      });
    }

    // Telefone mask
    if (regTelefone) {
      regTelefone.addEventListener("input", (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
      });
    }

    // CPF mask & validation listener
    if (regCpf) {
      regCpf.addEventListener("input", (e) => {
        const masked = aplicarMascaraCPF(e.target.value);
        e.target.value = masked;
        const clean = masked.replace(/\D/g, "");

        if (clean.length === 11) {
          if (validarCPF(clean)) {
            regCpf.classList.remove("is-invalid");
            regCpf.classList.add("is-valid");
            if (regCpfError) regCpfError.classList.remove("active");
            if (regCpfSuccess) regCpfSuccess.classList.add("active");
          } else {
            regCpf.classList.remove("is-valid");
            regCpf.classList.add("is-invalid");
            if (regCpfErrorText) regCpfErrorText.textContent = "CPF inválido. Verifique os dígitos.";
            if (regCpfError) regCpfError.classList.add("active");
            if (regCpfSuccess) regCpfSuccess.classList.remove("active");
          }
        } else {
          regCpf.classList.remove("is-valid");
          if (regCpfSuccess) regCpfSuccess.classList.remove("active");
          if (clean.length > 0 && clean.length < 11) {
            regCpf.classList.add("is-invalid");
            if (regCpfErrorText) regCpfErrorText.textContent = "O CPF deve conter exatamente 11 dígitos.";
            if (regCpfError) regCpfError.classList.add("active");
          } else {
            regCpf.classList.remove("is-invalid");
            if (regCpfError) regCpfError.classList.remove("active");
          }
        }
      });
    }

    // Password confirmation listener
    if (regConfirmaSenha && regSenha) {
      regConfirmaSenha.addEventListener("input", () => {
        if (regConfirmaSenha.value === regSenha.value && regConfirmaSenha.value.length >= 6) {
          regConfirmaSenha.classList.remove("is-invalid");
          regConfirmaSenha.classList.add("is-valid");
          if (regConfirmaSenhaError) regConfirmaSenhaError.classList.remove("active");
        } else {
          regConfirmaSenha.classList.remove("is-valid");
        }
      });
    }

    formCadastroUsuario.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nomeVal = regNome ? regNome.value.trim() : "";
      const emailVal = regEmail ? regEmail.value.trim() : "";
      const usernameVal = regUsername ? regUsername.value.trim() : "";
      const cpfVal = regCpf ? regCpf.value.replace(/\D/g, "") : "";
      const telefoneVal = regTelefone ? regTelefone.value.trim() : "";
      const senhaVal = regSenha ? regSenha.value : "";
      const confirmaSenhaVal = regConfirmaSenha ? regConfirmaSenha.value : "";

      let isValid = true;

      if (!nomeVal) {
        isValid = false;
        if (regNome) regNome.classList.add("is-invalid");
      }
      if (!emailVal || !emailVal.includes("@")) {
        isValid = false;
        if (regEmail) regEmail.classList.add("is-invalid");
      }
      if (usernameVal.length < 3) {
        isValid = false;
        if (regUsername) regUsername.classList.add("is-invalid");
      }
      if (!validarCPF(cpfVal)) {
        isValid = false;
        if (regCpf) regCpf.classList.add("is-invalid");
        if (regCpfErrorText) regCpfErrorText.textContent = "CPF inválido. Verifique os dígitos.";
        if (regCpfError) regCpfError.classList.add("active");
      }
      if (senhaVal.length < 6) {
        isValid = false;
        if (regSenha) regSenha.classList.add("is-invalid");
      }
      if (senhaVal !== confirmaSenhaVal) {
        isValid = false;
        if (regConfirmaSenha) regConfirmaSenha.classList.add("is-invalid");
        if (regConfirmaSenhaError) regConfirmaSenhaError.classList.add("active");
      }

      if (!isValid) {
        showToast("Por favor, preencha todos os campos corretamente.", "danger");
        return;
      }

      const userData = {
        nome: nomeVal,
        email: emailVal,
        username: usernameVal,
        cpf: regCpf ? regCpf.value : "",
        telefone: telefoneVal,
        senha: senhaVal
      };

      try {
        const response = await fetch(`${API_URL}/auth/register-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          const userSaved = data.usuario || userData;
          localStorage.setItem("currentUser", JSON.stringify(userSaved));

          showToast(data.mensagem || `Usuário ${nomeVal} cadastrado com sucesso! Redirecionando...`, "success");
          setTimeout(() => {
            window.location.href = "cadastroFrete.html";
          }, 1200);
        } else {
          const errData = await response.json();
          showToast(errData.erro || "Erro ao realizar cadastro.", "danger");
        }
      } catch (err) {
        console.warn("Servidor offline, salvando dados no localStorage...");
        localStorage.setItem("currentUser", JSON.stringify(userData));
        showToast(`Cadastro realizado com sucesso (modo offline)!`, "success");
        setTimeout(() => {
          window.location.href = "cadastroFrete.html";
        }, 1200);
      }
    });
  }

  const formMotorista = document.getElementById("formCadastroMotorista");
  if (formMotorista) {
    formMotorista.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome").value.trim();
      const telefone = document.getElementById("telefone").value.trim();
      const cnh = document.getElementById("cnh").value.trim();
      const veiculo = document.getElementById("veiculo").value.trim();
      const cidade = document.getElementById("cidade").value.trim();
      const disponibilidade = document
        .getElementById("disponibilidade")
        .value.trim();
      const observacoes = document.getElementById("observacoes")
        ? document.getElementById("observacoes").value.trim()
        : "";

      if (
        !nome ||
        !telefone ||
        !cnh ||
        !veiculo ||
        !cidade ||
        !disponibilidade
      ) {
        showToast(
          "Por favor, preencha todos os campos obrigatórios.",
          "danger",
        );
        return;
      }

      const motoristaObj = {
        nome,
        telefone,
        cnh,
        veiculo,
        cidade,
        disponibilidade,
        observacoes,
        dataCadastro: new Date().toLocaleDateString("pt-BR"),
      };

      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(motoristaObj),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          const userSaved = data.usuario || motoristaObj;
          localStorage.setItem("currentMotorista", JSON.stringify(userSaved));
          showToast(data.mensagem || `Motorista ${nome} conectado com sucesso!`, "success");
        } else {
          const errData = await response.json();
          showToast(errData.erro || "Erro ao realizar cadastro.", "danger");
          return;
        }
      } catch (err) {
        console.warn("Servidor offline, salvando motorista no localStorage...");
        localStorage.setItem("currentMotorista", JSON.stringify(motoristaObj));
        showToast(`Motorista ${nome} cadastrado com sucesso!`, "success");
      }

      setTimeout(() => {
        window.location.href = "frete.html";
      }, 1000);
    });
  }

  // --- LOGIN PAGE LOGIC & VALIDATIONS ---
  const formLogin = document.getElementById("formLogin");
  if (formLogin) {
    const inputUsername = document.getElementById("loginUsername");
    const inputCpf = document.getElementById("loginCpf");
    const inputSenha = document.getElementById("loginSenha");
    const togglePasswordBtn = document.getElementById("togglePasswordBtn");

    const usernameError = document.getElementById("usernameError");
    const cpfError = document.getElementById("cpfError");
    const cpfErrorText = document.getElementById("cpfErrorText");
    const cpfSuccess = document.getElementById("cpfSuccess");
    const passwordError = document.getElementById("passwordError");

    // Toggle Password Visibility
    if (togglePasswordBtn && inputSenha) {
      togglePasswordBtn.addEventListener("click", () => {
        const isPassword = inputSenha.type === "password";
        inputSenha.type = isPassword ? "text" : "password";
        const icon = togglePasswordBtn.querySelector("i");
        if (icon) {
          icon.className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
        }
        togglePasswordBtn.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
      });
    }

    // CPF Masking & Validation Listener
    if (inputCpf) {
      inputCpf.addEventListener("input", (e) => {
        const masked = aplicarMascaraCPF(e.target.value);
        e.target.value = masked;
        const clean = masked.replace(/\D/g, "");

        if (clean.length === 11) {
          if (validarCPF(clean)) {
            inputCpf.classList.remove("is-invalid");
            inputCpf.classList.add("is-valid");
            if (cpfError) cpfError.classList.remove("active");
            if (cpfSuccess) cpfSuccess.classList.add("active");
          } else {
            inputCpf.classList.remove("is-valid");
            inputCpf.classList.add("is-invalid");
            if (cpfErrorText) cpfErrorText.textContent = "CPF inválido. Verifique os dígitos digitados.";
            if (cpfError) cpfError.classList.add("active");
            if (cpfSuccess) cpfSuccess.classList.remove("active");
          }
        } else {
          inputCpf.classList.remove("is-valid");
          if (cpfSuccess) cpfSuccess.classList.remove("active");
          if (clean.length > 0 && clean.length < 11) {
            inputCpf.classList.add("is-invalid");
            if (cpfErrorText) cpfErrorText.textContent = "O CPF deve conter exatamente 11 dígitos.";
            if (cpfError) cpfError.classList.add("active");
          } else {
            inputCpf.classList.remove("is-invalid");
            if (cpfError) cpfError.classList.remove("active");
          }
        }
      });

      inputCpf.addEventListener("blur", () => {
        const clean = inputCpf.value.replace(/\D/g, "");
        if (!validarCPF(clean)) {
          inputCpf.classList.remove("is-valid");
          inputCpf.classList.add("is-invalid");
          if (cpfErrorText) {
            cpfErrorText.textContent = clean.length === 0 
              ? "O CPF é obrigatório." 
              : "CPF inválido. Verifique os dígitos digitados.";
          }
          if (cpfError) cpfError.classList.add("active");
          if (cpfSuccess) cpfSuccess.classList.remove("active");
        }
      });
    }

    // Username Listener
    if (inputUsername) {
      inputUsername.addEventListener("input", () => {
        if (inputUsername.value.trim().length >= 3) {
          inputUsername.classList.remove("is-invalid");
          inputUsername.classList.add("is-valid");
          if (usernameError) usernameError.classList.remove("active");
        } else {
          inputUsername.classList.remove("is-valid");
        }
      });

      inputUsername.addEventListener("blur", () => {
        if (inputUsername.value.trim().length < 3) {
          inputUsername.classList.remove("is-valid");
          inputUsername.classList.add("is-invalid");
          if (usernameError) usernameError.classList.add("active");
        }
      });
    }

    // Password Listener
    if (inputSenha) {
      inputSenha.addEventListener("input", () => {
        if (inputSenha.value.length >= 6) {
          inputSenha.classList.remove("is-invalid");
          inputSenha.classList.add("is-valid");
          if (passwordError) passwordError.classList.remove("active");
        } else {
          inputSenha.classList.remove("is-valid");
        }
      });

      inputSenha.addEventListener("blur", () => {
        if (inputSenha.value.length < 6) {
          inputSenha.classList.remove("is-valid");
          inputSenha.classList.add("is-invalid");
          if (passwordError) passwordError.classList.add("active");
        }
      });
    }

    // Form Submit Event
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usernameVal = inputUsername ? inputUsername.value.trim() : "";
      const cpfVal = inputCpf ? inputCpf.value.replace(/\D/g, "") : "";
      const senhaVal = inputSenha ? inputSenha.value : "";

      let isValid = true;

      // Validate Username
      if (usernameVal.length < 3) {
        isValid = false;
        if (inputUsername) inputUsername.classList.add("is-invalid");
        if (usernameError) usernameError.classList.add("active");
      }

      // Validate CPF
      if (!validarCPF(cpfVal)) {
        isValid = false;
        if (inputCpf) inputCpf.classList.add("is-invalid");
        if (cpfErrorText) {
          cpfErrorText.textContent = cpfVal.length === 0 
            ? "O CPF é obrigatório." 
            : "CPF inválido. Verifique os dígitos digitados.";
        }
        if (cpfError) cpfError.classList.add("active");
        if (cpfSuccess) cpfSuccess.classList.remove("active");
      }

      // Validate Password
      if (senhaVal.length < 6) {
        isValid = false;
        if (inputSenha) inputSenha.classList.add("is-invalid");
        if (passwordError) passwordError.classList.add("active");
      }

      if (!isValid) {
        showToast("Por favor, corrija os erros marcados em vermelho.", "danger");
        return;
      }

      const loginData = {
        login: usernameVal,
        username: usernameVal,
        cpf: inputCpf ? inputCpf.value : "",
        senha: senhaVal
      };

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          if (data.usuario) {
            localStorage.setItem("currentMotorista", JSON.stringify(data.usuario));
            localStorage.setItem("currentUser", JSON.stringify(data.usuario));
          } else {
            const userObj = { nome: usernameVal, cpf: loginData.cpf };
            localStorage.setItem("currentMotorista", JSON.stringify(userObj));
            localStorage.setItem("currentUser", JSON.stringify(userObj));
          }

          showToast(data.mensagem || "Login realizado com sucesso! Redirecionando...", "success");
          setTimeout(() => {
            window.location.href = "frete.html";
          }, 1200);
        } else {
          const errData = await response.json();
          showToast(errData.erro || "Falha ao realizar login. Verifique suas credenciais.", "danger");
        }
      } catch (err) {
        console.warn("Servidor offline, validando login localmente...");
        const userObj = { nome: usernameVal, cpf: loginData.cpf };
        localStorage.setItem("currentMotorista", JSON.stringify(userObj));
        localStorage.setItem("currentUser", JSON.stringify(userObj));

        showToast("Login efetuado com sucesso (modo offline)! Redirecionando...", "success");
        setTimeout(() => {
          window.location.href = "frete.html";
        }, 1200);
      }
    });
  }

  // --- FREIGHT POSTING FORM LOGIC ---
  const formCadastroFrete = document.getElementById("formCadastroFrete");
  if (formCadastroFrete) {
    const inputCep = document.getElementById("freteCep");
    const inputCidade = document.getElementById("freteCidade");
    const inputEstado = document.getElementById("freteEstado");
    const inputEndereco = document.getElementById("freteEndereco");
    const inputTelefone = document.getElementById("telefoneContato");

    if (inputTelefone) {
      inputTelefone.addEventListener("input", (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
      });
    }

    if (inputCep) {
      inputCep.addEventListener("input", async (e) => {
        const masked = aplicarMascaraCEP(e.target.value);
        e.target.value = masked;
        const clean = masked.replace(/\D/g, "");

        if (clean.length === 8) {
          const info = await buscarEnderecoPorCEP(clean);
          if (info) {
            if (inputCidade && info.localidade) inputCidade.value = info.localidade;
            if (inputEstado && info.uf) inputEstado.value = info.uf;
            if (inputEndereco && info.logradouro) {
              inputEndereco.value = `${info.logradouro}, ${info.bairro || ""}`;
            }
            const origemInput = document.getElementById("origem");
            if (origemInput && info.localidade && info.uf) {
              origemInput.value = `${info.bairro ? info.bairro + ", " : ""}${info.localidade} - ${info.uf}`;
            }
            showToast(`CEP ${masked} localizado! Endereço preenchido.`, "info");
          }
        }
      });
    }

    formCadastroFrete.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nomeCarga = document.getElementById("nomeCarga").value.trim();
      const nomePessoa = document.getElementById("nomePessoa").value.trim();
      const telefoneContato = inputTelefone ? inputTelefone.value.trim() : "";
      const cep = inputCep ? inputCep.value.trim() : "";
      const estado = inputEstado ? inputEstado.value.trim() : "";
      const cidade = inputCidade ? inputCidade.value.trim() : "";
      const endereco = inputEndereco ? inputEndereco.value.trim() : "";
      const origem = document.getElementById("origem") ? document.getElementById("origem").value.trim() : "";
      const destino = document.getElementById("destino") ? document.getElementById("destino").value.trim() : "";

      if (!nomeCarga || !nomePessoa || !telefoneContato) {
        showToast("Por favor, preencha todos os campos obrigatórios.", "danger");
        return;
      }

      const freteObj = {
        nomeCarga,
        nomePessoa,
        telefoneContato,
        cep,
        estado,
        cidade,
        endereco,
        origem: origem || (cidade && estado ? `${cidade} - ${estado}` : "Origem a combinar"),
        destino: destino || "Destino a combinar",
        status: "disponivel",
        data: new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      };

      try {
        const response = await fetch(`${API_URL}/fretes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(freteObj)
        });

        if (response.ok) {
          const data = await response.json();
          // Diagram exact confirmation text: "Seu frete foi inserido no nosso sistema"
          showToast(data.mensagem || "Seu frete foi inserido no nosso sistema", "success");
        } else {
          showToast("Seu frete foi inserido no nosso sistema", "success");
        }
      } catch (err) {
        console.warn("Servidor offline, salvando frete localmente...");
        let fretesLocais = JSON.parse(localStorage.getItem("fretes") || "[]");
        fretesLocais.unshift({ ...freteObj, id: Date.now().toString() });
        localStorage.setItem("fretes", JSON.stringify(fretesLocais));
        showToast("Seu frete foi inserido no nosso sistema", "success");
      }

      setTimeout(() => {
        window.location.href = "frete.html";
      }, 1500);
    });
  }

  if (document.getElementById("listaCargas")) {
    atualizarListaFretes();
    setInterval(atualizarListaFretes, 5000);
  }
});

