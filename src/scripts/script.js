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
  if (!motorista || !motorista.nome) {
    const nome = prompt(
      "Para aceitar o pedido, digite seu nome completo de motorista:",
    );
    if (!nome || !nome.trim()) {
      showToast(
        "É necessário informar o seu nome para aceitar o frete.",
        "danger",
      );
      return;
    }
    const telefone = prompt("Digite seu telefone de contato:") || "";
    const veiculo =
      prompt(
        "Digite o modelo do seu veículo (ex: Caminhonete, Vans, Furgão):",
      ) || "Veículo cadastrado";

    motorista = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      veiculo: veiculo.trim(),
    };
    localStorage.setItem("currentMotorista", JSON.stringify(motorista));
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

document.addEventListener("DOMContentLoaded", () => {
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

  if (document.getElementById("listaCargas")) {
    atualizarListaFretes();
    setInterval(atualizarListaFretes, 5000);
  }
});
