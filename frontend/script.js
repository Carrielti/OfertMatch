/* =========================
   MENU LATERAL (abrir/fechar)
   ========================= */

// Pega elementos necessários
const btnMenu = document.getElementById("btnMenu");
const menuLateral = document.getElementById("menuLateral");
const overlay = document.getElementById("overlay");

let menuAberto = false;

// ===== CONFIG API =====
// (Render) -> troque aqui se mudar o domínio da API
const BASE_URL = "https://ofertmatch.onrender.com";

const ENDPOINTS = {
  empresas: `${BASE_URL}/api/empresas`,
  produtos: `${BASE_URL}/api/produtos`,
  ofertas:  `${BASE_URL}/api/ofertas`,
  health:   `${BASE_URL}/api/health`,
};

// Abre/fecha menu
function abrirMenu(){
  menuLateral.style.left = "0";
  overlay.style.display = "block";
  btnMenu.setAttribute("aria-expanded", "true");
  menuAberto = true;
}
function fecharMenu(){
  menuLateral.style.left = "-250px";
  overlay.style.display = "none";
  btnMenu.setAttribute("aria-expanded", "false");
  menuAberto = false;
}
btnMenu?.addEventListener("click", () => { menuAberto ? fecharMenu() : abrirMenu(); });
overlay?.addEventListener("click", fecharMenu);
document.addEventListener("keydown", (e)=>{ if(e.key === "Escape" && menuAberto){ fecharMenu(); btnMenu?.focus(); }});

/* =========================
   MODAIS (abrir/fechar)
   ========================= */

const modalEmpresa = document.getElementById("modalEmpresa");
const modalProduto = document.getElementById("modalProduto");
const modalOferta  = document.getElementById("modalOferta");

const cards = document.querySelectorAll(".card");
cards.forEach(card => {
  card.addEventListener("click", ()=>{
    const destino = card.getAttribute("data-open");
    abrirModal(destino);
  });
});

const botoesFechar = document.querySelectorAll(".fechar, .cancelar");
botoesFechar.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const modalId = btn.getAttribute("data-modal");
    fecharModal(modalId);
  });
});

window.addEventListener("click", (e)=>{
  if(e.target.classList.contains("modal")){
    e.target.style.display = "none";
    e.target.setAttribute("aria-hidden", "true");
  }
});

function abrirModal(id) {
  const el = document.getElementById(id);
  el.style.display = "flex";
  el.offsetHeight; // reflow
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  const firstInput = el.querySelector("input, select, textarea, button.salvar");
  if (firstInput) firstInput.focus();
  function escHandler(ev) {
    if (ev.key === "Escape") {
      fecharModal(id);
      document.removeEventListener("keydown", escHandler);
    }
  }
  document.addEventListener("keydown", escHandler);
}

function fecharModal(id) {
  const el = document.getElementById(id);
  el.classList.remove("show");
  setTimeout(() => {
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }, 300);
}

/* =========================
   TOAST
   ========================= */

function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  toast.className = "toast";
  toast.classList.add(tipo);
  toast.textContent = mensagem;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* =========================
   API helpers
   ========================= */

async function apiGet(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || j.ok === false) throw new Error(j.msg || "Erro ao buscar dados.");
    return j.data || [];
  } catch (e) {
    console.error(e);
    mostrarToast(e.message || "Falha de conexão.", "erro");
    return [];
  }
}

async function apiPost(url, body) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = { ok:false, msg: txt || "Resposta não-JSON" }; }
    if (!r.ok || j.ok === false) throw new Error(j.msg || `Erro HTTP ${r.status}`);
    return j;
  } catch (e) {
    console.error("POST error:", e);
    mostrarToast(e.message || "Falha ao enviar.", "erro");
    return null;
  }
}

/* =========================
   LISTAGEM: GET + render na tabela
   ========================= */

function showBox(idToShow) {
  document.querySelectorAll(".box-lista").forEach(box => box.hidden = true);
  const box = document.getElementById(idToShow);
  if (box) box.hidden = false;
}

function renderEmpresas(items) {
  const tbody = document.getElementById("tbodyEmpresas");
  if (!tbody) return;
  tbody.innerHTML = "";
  items.forEach(emp => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.razao_social ?? ""}</td>
      <td>${emp.cnpj ?? ""}</td>
      <td>${emp.endereco ?? ""}</td>
      <td>${emp.email ?? ""}</td>
      <td>${emp.responsavel ?? ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProdutos(items) {
  const tbody = document.getElementById("tbodyProdutos");
  if (!tbody) return;
  tbody.innerHTML = "";
  items.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nome ?? ""}</td>
      <td>${p.codigo ?? ""}</td>
      <td>${p.estoque ?? ""}</td>
      <td>${p.categoria ?? ""}</td>
      <td>${p.marca ?? ""}</td>
      <td>${p.valor ?? ""}</td>
      <td>${p.validade ?? ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOfertas(items) {
  const tbody = document.getElementById("tbodyOfertas");
  if (!tbody) return;
  tbody.innerHTML = "";
  items.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.produto ?? ""}</td>
      <td>${o.marca ?? ""}</td>
      <td>${o.codigo ?? ""}</td>
      <td>${o.estoque ?? ""}</td>
      <td>${o.categoria ?? ""}</td>
      <td>${o.valor ?? ""}</td>
      <td>${o.validade ?? ""}</td>
      <td>${o.data_inicio ?? ""}</td>
      <td>${o.data_fim ?? ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function carregarEmpresas() {
  showBox("boxEmpresas");
  const data = await apiGet(ENDPOINTS.empresas);
  renderEmpresas(data);
}
async function carregarProdutos() {
  showBox("boxProdutos");
  const data = await apiGet(ENDPOINTS.produtos);
  renderProdutos(data);
}
async function carregarOfertas() {
  showBox("boxOfertas");
  const data = await apiGet(ENDPOINTS.ofertas);
  renderOfertas(data);
}

document.getElementById("btnVerEmpresas")?.addEventListener("click", carregarEmpresas);
document.getElementById("btnVerProdutos")?.addEventListener("click", carregarProdutos);
document.getElementById("btnVerOfertas")?.addEventListener("click", carregarOfertas);

/* =========================
   SUBMIT dos formulários (POST real)
   ========================= */

const MAP_KEYS = {
  modalEmpresa: {
    "Razão social": "razao_social",
    "CNPJ": "cnpj",
    "Endereço": "endereco",
    "E-mail empresarial": "email",
    "Responsável": "responsavel",
  },
  modalProduto: {
    "Produto": "nome",
    "Código de produto": "codigo",
    "Estoque": "estoque",
    "Categoria": "categoria",
    "Marca": "marca",
    "Valor": "valor",
    "Validade": "validade",
  },
  modalOferta: {
    "Produto": "produto",
    "Marca": "marca",
    "Código do produto": "codigo",
    "Estoque": "estoque",
    "Categoria": "categoria",
    "Valor": "valor",
    "Validade": "validade",
    "Data início": "data_inicio",
    "Data fim": "data_fim",
  }
};

// Converte números onde fizer sentido
function coerceValue(key, value) {
  const numeric = ["estoque", "valor"];
  if (numeric.includes(key)) {
    const n = Number((value ?? "").toString().replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  return (value ?? "").trim();
}

document.querySelectorAll(".modal form").forEach(form => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const modal = form.closest(".modal");
    const modalId = modal.id;
    const map = MAP_KEYS[modalId];
    const inputs = form.querySelectorAll("input");
    let vazio = false;
    const payload = {};
    inputs.forEach(inp => {
      const ph = inp.getAttribute("placeholder") || "";
      const key = map?.[ph];
      if ((inp.value ?? "").trim() === "") {
        inp.style.border = "2px solid #c0392b";
        vazio = true;
      } else {
        inp.style.border = "2px solid #59e1a1";
      }
      if (key) payload[key] = coerceValue(key, inp.value);
    });
    if (vazio) { mostrarToast("Por favor, preencha todos os campos obrigatórios.", "erro"); return; }

    // Decide endpoint
    let endpoint = "";
    if (modalId === "modalEmpresa") endpoint = ENDPOINTS.empresas;
    else if (modalId === "modalProduto") endpoint = ENDPOINTS.produtos;
    else if (modalId === "modalOferta") endpoint = ENDPOINTS.ofertas;

    const ok = await apiPost(endpoint, payload);
    if (ok && ok.ok) {
      mostrarToast("Cadastro salvo com sucesso!", "sucesso");
      form.reset();
      inputs.forEach(i => i.style.border = "none");
      fecharModal(modalId);
      if (modalId === "modalEmpresa") carregarEmpresas();
      if (modalId === "modalProduto") carregarProdutos();
      if (modalId === "modalOferta")  carregarOfertas();
    }
  });
});

/* =========================
   MENU: MARCAR ITEM ATIVO
   ========================= */
const menuLinks = document.querySelectorAll(".menu-lateral a");
menuLinks.forEach(link => {
  link.addEventListener("click", function() {
    menuLinks.forEach(l => l.classList.remove("active"));
    this.classList.add("active");
  });
});
document.querySelectorAll(".menu-lateral a").forEach(link => {
  if (link.href === window.location.href) link.classList.add("active");
});

/* =========================
   HEALTH CHECK (uma vez só)
   ========================= */
async function checkApi() {
  const el = document.getElementById("api-status");
  if (!el) return;
  try {
    const r = await fetch(ENDPOINTS.health, { cache: "no-store" });
    const data = await r.json();
    el.textContent = data?.ok ? "API online ✅" : "API respondeu, mas sem OK";
  } catch {
    el.textContent = "API offline (Render hibernado?) ⏳";
  }
}
document.addEventListener("DOMContentLoaded", checkApi);
// Se quiser já abrir empresas ao carregar a página, descomente:
// document.addEventListener("DOMContentLoaded", carregarEmpresas);
