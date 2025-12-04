// script.js - unificado (legado + app.js)
// Toda a lógica principal agora está aqui.
// Não é mais necessário usar app.js separado.
console.warn("script.js unificado: inclui lógica antiga + app.js.");


/* =========================
   CONFIG BÁSICA
   ========================= */

// Botões/elementos que podem não existir em todas as páginas
const btnMenu     = document.getElementById("btnMenu");
const menuLateral = document.getElementById("menuLateral");
const overlay     = document.getElementById("overlay");

let menuAberto = false;

// ===== CONFIG API =====
// Troque o domínio se mudar o Render
const BASE_URL = "https://ofertmatch-2-0.onrender.com";

const ENDPOINTS = {
  empresas: `${BASE_URL}/api/empresas`,
  produtos: `${BASE_URL}/api/produtos`,
  ofertas:  `${BASE_URL}/api/ofertas`,
  health:   `${BASE_URL}/api/health`,
  register: `${BASE_URL}/api/auth/register`,
  login:    `${BASE_URL}/api/auth/login`,
};


/* =========================
   MENU LATERAL (abrir/fechar) - legado (menuLateral + overlay)
   ========================= */
function abrirMenu(){
  if (!menuLateral || !overlay || !btnMenu) return;
  menuLateral.style.left = "0";
  overlay.style.display = "block";
  btnMenu.setAttribute("aria-expanded", "true");
  menuAberto = true;
}
function fecharMenu(){
  if (!menuLateral || !overlay || !btnMenu) return;
  menuLateral.style.left = "-250px";
  overlay.style.display = "none";
  btnMenu.setAttribute("aria-expanded", "false");
  menuAberto = false;
}

btnMenu?.addEventListener("click", () => {
  menuAberto ? fecharMenu() : abrirMenu();
});

overlay?.addEventListener("click", () => {
  if (menuAberto) fecharMenu();
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && menuAberto){
    fecharMenu();
    btnMenu?.focus();
  }
});


/* =========================
   MODAIS (abrir/fechar)
   ========================= */

function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "flex";
  el.offsetHeight; // forçar reflow pra animar
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");

  // foca no 1º campo útil
  const firstInput = el.querySelector("input, select, textarea, button.salvar");
  if (firstInput) firstInput.focus();

  // ESC fecha
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
  if (!el) return;
  el.classList.remove("show");
  setTimeout(() => {
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }, 300);
}

// abrir modais via cards (home)
document.querySelectorAll(".card[data-open]").forEach(card => {
  card.addEventListener("click", ()=>{
    const destino = card.getAttribute("data-open");
    if (destino) abrirModal(destino);
  });
});

// botões X e Cancelar
document.querySelectorAll(".fechar, .cancelar").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const modalId = btn.getAttribute("data-modal");
    if (modalId) fecharModal(modalId);
  });
});

// clique fora da caixa fecha modal
window.addEventListener("click", (e)=>{
  if(e.target.classList?.contains?.("modal")){
    e.target.style.display = "none";
    e.target.setAttribute("aria-hidden", "true");
  }
});


/* =========================
   TOAST
   ========================= */
function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  if (!toast) return alert(mensagem); // fallback simples
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
    let j; 
    try { 
      j = JSON.parse(txt); 
    } catch { 
      j = { ok:false, msg: txt || "Resposta não-JSON" }; 
    }
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
  document.querySelectorAll(".box-lista").forEach(box => { box.hidden = true; });
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

/** Mapeamento por placeholder (legado). Mantido para compatibilidade. */
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
    if (!modal) return;
    const modalId = modal.id;
    const map = MAP_KEYS[modalId] || {};

    const inputs = form.querySelectorAll("input, select, textarea");
    let vazio = false;
    const payload = {};

    inputs.forEach(inp => {
      const attrKey = inp.getAttribute("data-field");          // preferível
      const ph      = inp.getAttribute("placeholder") || "";
      const key     = attrKey || map?.[ph];                    // fallback p/ placeholder legado
      const val     = (inp.value ?? "").trim();

      if (inp.hasAttribute("required") && val === "") {
        inp.style.border = "2px solid #c0392b";
        vazio = true;
      } else if (val !== "") {
        inp.style.border = "2px solid #59e1a1";
      } else {
        inp.style.border = ""; // limpa
      }

      if (key) payload[key] = coerceValue(key, val);
    });

    if (vazio) {
      mostrarToast("Por favor, preencha todos os campos obrigatórios.", "erro");
      return;
    }

    // Decide endpoint
    let endpoint = "";
    if (modalId === "modalEmpresa") endpoint = ENDPOINTS.empresas;
    else if (modalId === "modalProduto") endpoint = ENDPOINTS.produtos;
    else if (modalId === "modalOferta")  endpoint = ENDPOINTS.ofertas;
    if (!endpoint) {
      mostrarToast("Formulário sem endpoint configurado.", "erro");
      return;
    }

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
// marca ativo pelo URL ao carregar
document.querySelectorAll(".menu-lateral a").forEach(link => {
  try {
    if (link.href === window.location.href) link.classList.add("active");
  } catch {}
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


/* =========================
   THEME (unificado, baseado no app.js)
   ========================= */
const body = document.body;
const THEME_KEY = "theme"; // 'dark' | 'light'

// aplica tema salvo
(function aplicarTemaInicial() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    body.classList.add("theme-dark");
    body.classList.remove("theme-light");
  } else if (savedTheme === "light") {
    body.classList.add("theme-light");
    body.classList.remove("theme-dark");
  }
})();

const btnTheme = document.getElementById("btnTheme");
const toggleThemeBtn = document.getElementById("toggleTheme");
const opAlterarTema = document.getElementById("opAlterarTema");

function toggleTheme() {
  const isDark = !body.classList.contains("theme-dark");
  body.classList.toggle("theme-dark", isDark);
  body.classList.toggle("theme-light", !isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

btnTheme?.addEventListener("click", toggleTheme);
toggleThemeBtn?.addEventListener("click", toggleTheme);
opAlterarTema?.addEventListener("click", toggleTheme);


/* =========================
   AUTO-CARREGAMENTO por página
   (usa <body data-page="..."> nas páginas de lista)
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body?.dataset?.page || "";
  if (page === "lista-ofertas")  carregarOfertas();
  if (page === "lista-produtos") carregarProdutos();
  // se quiser: if (page === "home-empresa") carregarEmpresas() etc.
});


/* =========================
   PAINEL DIREITO (Configurações ⚙ / menuOpcoes ou menuConfig)
   ========================= */
const btnConfig  = document.getElementById("btnConfig");

// Detecta qual painel existe (páginas antigas ou novas)
const painelDireito = document.getElementById("menuOpcoes") || document.getElementById("menuConfig");
const overlayPainel = document.getElementById("overlay");

let painelAberto = false;

function abrirPainel() {
  if (!painelDireito) return;
  painelDireito.classList.add("open", "show");
  painelDireito.setAttribute("aria-hidden", "false");
  if (overlayPainel) overlayPainel.style.display = "block";
  painelAberto = true;
}

function fecharPainel() {
  if (!painelDireito) return;
  painelDireito.classList.remove("open", "show");
  painelDireito.setAttribute("aria-hidden", "true");
  if (overlayPainel) overlayPainel.style.display = "none";
  painelAberto = false;
}

// Botão ⚙ abre/fecha painel
btnConfig?.addEventListener("click", (e) => {
  e.stopPropagation();
  painelAberto ? fecharPainel() : abrirPainel();
});

// Fecha ao clicar fora
document.addEventListener("click", (e) => {
  if (
    painelAberto &&
    painelDireito &&
    !painelDireito.contains(e.target) &&
    e.target !== btnConfig
  ) {
    fecharPainel();
  }
});

// Fecha com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && painelAberto) fecharPainel();
});


/* =========================
   AÇÕES DO MENU DIREITO
   ========================= */
document.getElementById("opPerfil")?.addEventListener("click", () => {
  mostrarToast("Abrindo perfil…");
});

document.getElementById("opSair")?.addEventListener("click", () => {
  mostrarToast("Saindo…");
  // Exemplo: window.location.href = "login.html";
});


/* =========================
   GAVETAS / DRAWERS (do app.js)
   ========================= */

// backdrop das gavetas
const backdrop = document.getElementById("backdrop");

function openDrawer(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("show");
  if (backdrop) backdrop.classList.add("show");
}

function closeDrawer(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
  if (!document.querySelector(".drawer.show") && backdrop) {
    backdrop.classList.remove("show");
  }
}

// botões com data-close
document.querySelectorAll("[data-close]").forEach(b => {
  b.addEventListener("click", () => closeDrawer(b.dataset.close));
});

// clique no backdrop fecha todas as gavetas
backdrop?.addEventListener("click", () => {
  document.querySelectorAll(".drawer.show").forEach(d => d.classList.remove("show"));
  backdrop.classList.remove("show");
});

// botão de menu que abre drawerMenu
const btnMenuDrawer = document.getElementById("btnMenu");
btnMenuDrawer?.addEventListener("click", () => {
  if (document.getElementById("drawerMenu")) {
    openDrawer("drawerMenu");
  } else {
    // se não tiver drawerMenu, cai no menu lateral legado (já tratado acima)
  }
});

// botão "Minha Lista" abre drawerLista
const btnLista = document.getElementById("btnLista");
btnLista?.addEventListener("click", () => openDrawer("drawerLista"));

/* ======= Fechamento de drawers por tecla Esc ======= */
document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape"){
    document.querySelectorAll(".drawer.show").forEach(d=>d.classList.remove("show"));
    if (backdrop) backdrop.classList.remove("show");
  }
});


/* =========================
   CATÁLOGO E CARRINHO (do app.js)
   ========================= */
const PRODUTOS = [
  {id:"p01", nome:"Pão Bisnaguinha Tradicional Qualita Pacote 300g", preco:6.99, emoji:"🥖"},
  {id:"p02", nome:"Requeijão Cremoso TIROLEZ Copo 200g", preco:8.19, emoji:"🧀"},
  {id:"p03", nome:"Suco Uva e Maçã Natural One 900ml", preco:14.44, emoji:"🧃"},
  {id:"p04", nome:"Coca-Cola Orig e Fanta 2l cada", preco:19.49, emoji:"🥤"},
  {id:"p05", nome:"Leite UHT Integral 1L", preco:4.89, emoji:"🥛"},
  {id:"p06", nome:"Contra Filé em Bife Bandeja 600g", preco:38.34, emoji:"🥩"},
  {id:"p07", nome:"Pizza Napolitana Perdigão 460g", preco:18.29, emoji:"🍕"},
  {id:"p08", nome:"Cerveja Heineken Lata Sleek 350ml", preco:5.99, emoji:"🍺"},
];

function loadCart(){
  try{ 
    return JSON.parse(localStorage.getItem("cart") || "{}"); 
  }catch{ 
    return {}; 
  }
}
function saveCart(cart){ 
  localStorage.setItem("cart", JSON.stringify(cart)); 
}
function addToCart(id){
  const cart = loadCart();
  cart[id] = (cart[id] || 0) + 1;
  saveCart(cart);
  renderLista();
}
function changeQty(id, delta){
  const cart = loadCart();
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if(cart[id] === 0) delete cart[id];
  saveCart(cart); 
  renderLista();
}
function removeItem(id){
  const cart = loadCart(); 
  delete cart[id]; 
  saveCart(cart); 
  renderLista();
}
function clearCart(){ 
  saveCart({}); 
  renderLista(); 
}

/* ======= Grid de Produtos (Ofertas mockadas para home cliente) ======= */
const grid = document.getElementById("gridProdutos");
if (grid){
  grid.innerHTML = PRODUTOS.map(p=>`
    <article class="card">
      <div class="card-thumb">${p.emoji}</div>
      <div class="card-title">${p.nome}</div>
      <div class="card-price">R$ ${p.preco.toFixed(2).replace(".", ",")}</div>
      <button class="btn-fab" aria-label="adicionar" data-add="${p.id}">＋</button>
    </article>
  `).join("");
  grid.addEventListener("click", (e)=>{
    const id = e.target.dataset.add;
    if (id) addToCart(id);
  });
}

/* ======= Gaveta Minha Lista ======= */
const listaItens = document.getElementById("listaItens");
function renderLista(){
  if (!listaItens) return;
  const cart = loadCart();
  const ids = Object.keys(cart);
  if (ids.length === 0){
    listaItens.innerHTML = `<p>Seu carrinho está vazio.</p>`;
    return;
  }
  listaItens.innerHTML = ids.map(id=>{
    const p = PRODUTOS.find(x=>x.id===id) || {nome:"Item", preco:0, emoji:"🛍️"};
    const q = cart[id];
    return `
      <div class="list-item">
        <div>${p.emoji}</div>
        <div>
          <div style="font-weight:700">${p.nome}</div>
          <small>R$ ${p.preco.toFixed(2).replace(".", ",")}</small>
        </div>
        <div class="qty">
          <button aria-label="diminuir" data-qminus="${id}">−</button>
          <span>${q}</span>
          <button aria-label="aumentar" data-qplus="${id}">＋</button>
          <button class="rem" data-remove="${id}">remover</button>
        </div>
      </div>
    `;
  }).join("");
}

listaItens?.addEventListener("click", (e)=>{
  if (e.target.dataset.qplus)  changeQty(e.target.dataset.qplus, +1);
  if (e.target.dataset.qminus) changeQty(e.target.dataset.qminus, -1);
  if (e.target.dataset.remove) removeItem(e.target.dataset.remove);
});

const btnLimpar = document.getElementById("btnLimpar");
btnLimpar?.addEventListener("click", clearCart);

// render inicial se a gaveta existir
renderLista();

document.addEventListener("DOMContentLoaded", () => {
  const tipo = localStorage.getItem("tipoUsuario"); // "cliente" ou "empresa"
  const linkInicio = document.getElementById("linkInicio");
  const itensEmpresa = document.querySelectorAll(".menu-empresa");
  
  if (tipo === "cliente") {
    linkInicio.href = "home_clientes.html";
  } else {
    // padrão: empresa, ou caso ainda não esteja definido
    linkInicio.href = "home_empresa.html";
  }
  // 2) Esconde ou mostra os itens exclusivos da empresa
  if (tipo === "cliente") {
    itensEmpresa.forEach(li => li.style.display = "none");
  } else {
    itensEmpresa.forEach(li => li.style.display = "");
  }

  const btnOfertasDia  = document.getElementById("btnOfertasDia");

  // função auxiliar pra decidir pra onde ir
  function irParaOfertas() {
    if (tipo === "empresa") {
      // caminho para a tela de ofertas do CLIENTE
      window.location.href = "lista_ofertas.html";      // ajuste se estiver em outra pasta
    } else {
      // caminho para a tela de ofertas da EMPRESA
      window.location.href = "ofertas.html";      // ajuste se precisar de ../
    }
  }

  if (btnOfertasDia) {
    btnOfertasDia.addEventListener("click", (e) => {
      e.preventDefault();
      irParaOfertas();
    });
  }

document.addEventListener("DOMContentLoaded", () => {
  const btnLista = document.getElementById("btnLista");

  if (btnLista) {
    btnLista.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer("drawerLista"); // abre a gaveta da lista
    });
  }
});

  // Se NÃO for empresa, esconde tudo que é só da empresa
  if (tipo !== "empresa") {
    itensEmpresa.forEach(li => {
      li.style.display = "none";
    });
  } else {
    // empresa logada → mostra normalmente
    itensEmpresa.forEach(li => {
      li.style.display = "";
    });
  }

});
