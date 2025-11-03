/* =========================
   MENU LATERAL (abrir/fechar)
   ========================= */

// Pega elementos necessários
const btnMenu = document.getElementById("btnMenu");       // Seleciona o botão ☰ no header
const menuLateral = document.getElementById("menuLateral");// Seleciona o nav do menu lateral
const overlay = document.getElementById("overlay");        // Seleciona o backdrop escuro

let menuAberto = false; // Controla se o menu está aberto (true) ou fechado (false)

// ===== CONFIG API =====
// Se sua API estiver no Render, troque por "https://SEU-APP.onrender.com"
const BASE_URL = "http://localhost:5000"; // URL base do backend em ambiente local

const ENDPOINTS = {                         // Mapa com endpoints REST do backend
  empresas: `${BASE_URL}/api/empresas`,     // Endpoint para CRUD/listagem de empresas
  produtos: `${BASE_URL}/api/produtos`,     // Endpoint para CRUD/listagem de produtos
  ofertas:  `${BASE_URL}/api/ofertas`,      // Endpoint para CRUD/listagem de ofertas
};

// Abre/fecha menu
function abrirMenu(){                                     // Função para abrir o menu lateral
  menuLateral.style.left = "0";                           // Move o menu para dentro da tela
  overlay.style.display = "block";                        // Exibe o fundo escuro atrás do menu
  btnMenu.setAttribute("aria-expanded", "true");          // Acessibilidade: indica estado expandido
  menuAberto = true;                                      // Atualiza o estado do controle
}
function fecharMenu(){                                    // Função para fechar o menu lateral
  menuLateral.style.left = "-250px";                      // Reposiciona o menu para fora da tela
  overlay.style.display = "none";                         // Esconde o fundo escuro
  btnMenu.setAttribute("aria-expanded", "false");         // Acessibilidade: indica estado fechado
  menuAberto = false;                                     // Atualiza o estado do controle
}
btnMenu.addEventListener("click", () => { menuAberto ? fecharMenu() : abrirMenu(); }); // Alterna abrir/fechar ao clicar
overlay.addEventListener("click", fecharMenu);                                    // Fecha o menu ao clicar no overlay
document.addEventListener("keydown", (e)=>{ if(e.key === "Escape" && menuAberto){ fecharMenu(); btnMenu.focus(); }}); // Fecha com ESC e devolve foco

/* =========================
   MODAIS (abrir/fechar)
   ========================= */

const modalEmpresa = document.getElementById("modalEmpresa"); // Referência ao modal de empresa
const modalProduto = document.getElementById("modalProduto"); // Referência ao modal de produto
const modalOferta  = document.getElementById("modalOferta");  // Referência ao modal de oferta

const cards = document.querySelectorAll(".card");             // Seleciona os cards de ação na home
cards.forEach(card => {                                       // Para cada card...
  card.addEventListener("click", ()=>{                        // ...escuta clique
    const destino = card.getAttribute("data-open");           // Lê o id do modal alvo do atributo data-open
    abrirModal(destino);                                      // Abre o modal correspondente
  });
});

const botoesFechar = document.querySelectorAll(".fechar, .cancelar"); // Seleciona botões que fecham modais
botoesFechar.forEach(btn=>{                                             // Para cada botão...
  btn.addEventListener("click", ()=>{                                   // ...escuta clique
    const modalId = btn.getAttribute("data-modal");                     // Lê o id do modal no data-modal
    fecharModal(modalId);                                               // Fecha o modal correspondente
  });
});

window.addEventListener("click", (e)=>{                                 // Fecha modal clicando fora do conteúdo
  if(e.target.classList.contains("modal")){                             // Se clicou no backdrop do modal...
    e.target.style.display = "none";                                     // ...some com o modal
    e.target.setAttribute("aria-hidden", "true");                        // Marca como escondido para acessibilidade
  }
});

// Animação/teclado
function abrirModal(id) {                                               // Função para abrir modal com animação
  const el = document.getElementById(id);                               // Obtém o elemento do modal pelo id
  el.style.display = "flex";                                            // Exibe modal (flex para centralizar conteúdo)
  el.offsetHeight;                                                      // Força reflow para ativar transição CSS
  el.classList.add("show");                                             // Adiciona classe que anima a entrada
  el.setAttribute("aria-hidden", "false");                              // Acessibilidade: torna visível
  const firstInput = el.querySelector("input, select, textarea, button.salvar"); // Acha primeiro campo focável
  if (firstInput) firstInput.focus();                                   // Foca para melhor UX
  function escHandler(ev) {                                             // Define handler para tecla ESC
    if (ev.key === "Escape") {                                          // Se pressionou ESC...
      fecharModal(id);                                                  // ...fecha o modal
      document.removeEventListener("keydown", escHandler);              // Remove o listener para não acumular
    }
  }
  document.addEventListener("keydown", escHandler);                     // Ativa o listener de ESC enquanto aberto
}

function fecharModal(id) {                                              // Função para fechar modal com animação
  const el = document.getElementById(id);                               // Obtém o modal pelo id
  el.classList.remove("show");                                          // Remove classe de exibição (ativa transição de saída)
  setTimeout(() => {                                                    // Aguarda o fim da transição CSS
    el.style.display = "none";                                          // Esconde o modal
    el.setAttribute("aria-hidden", "true");                             // Acessibilidade: marca como oculto
  }, 300);                                                              // Tempo compatível com transition do CSS
}

/* =========================
   TOAST
   ========================= */

function mostrarToast(mensagem, tipo = "sucesso") {                     // Exibe mensagem temporária (toast)
  const toast = document.getElementById("toast");                       // Seleciona o container do toast
  toast.className = "toast";                                            // Reseta classes para estado base
  toast.classList.add(tipo);                                            // Aplica classe de tipo (sucesso/erro/aviso)
  toast.textContent = mensagem;                                         // Define o texto da mensagem
  toast.classList.add("show");                                          // Exibe o toast (classe show)
  setTimeout(() => toast.classList.remove("show"), 3000);               // Esconde após 3 segundos
}

/* =========================
   API helpers
   ========================= */

async function apiGet(url) {                                            // Helper para GET com tratamento de erro
  try {                                                                 // Tenta fazer a requisição
    const r = await fetch(url);                                         // Faz o fetch GET
    const j = await r.json();                                           // Tenta ler o corpo como JSON
    if (!r.ok || j.ok === false) throw new Error(j.msg || "Erro ao buscar dados."); // Se HTTP != 2xx ou ok=false, lança erro
    return j.data || [];                                                // Retorna array de dados (ou vazio)
  } catch (e) {                                                         // Captura erros de rede/parse
    console.error(e);                                                   // Loga no console para debug
    mostrarToast(e.message || "Falha de conexão.", "erro");             // Mostra toast de erro amigável
    return [];                                                          // Retorna lista vazia para evitar quebras
  }
}

async function apiPost(url, body) {                                     // Helper para POST com fallback p/ não-JSON
  try {                                                                 // Tenta enviar os dados
    const r = await fetch(url, {                                        // Faz o fetch POST
      method: "POST",                                                   // Método HTTP
      headers: { "Content-Type": "application/json" },                  // Define cabeçalho de JSON
      body: JSON.stringify(body),                                       // Serializa o corpo para JSON
    });
    const txt = await r.text();                                         // Lê a resposta como texto (para fallback)
    let j; try { j = JSON.parse(txt); } catch { j = { ok:false, msg: txt || "Resposta não-JSON" }; } // Tenta parsear JSON
    if (!r.ok || j.ok === false) throw new Error(j.msg || `Erro HTTP ${r.status}`); // Se erro HTTP/negócio, lança erro
    return j;                                                           // Retorna o JSON da API
  } catch (e) {                                                         // Captura falhas e trata
    console.error("POST error:", e);                                    // Log detalhado no console
    mostrarToast(e.message || "Falha ao enviar.", "erro");              // Toast para o usuário
    return null;                                                        // Retorna nulo para indicar falha
  }
}

/* =========================
   LISTAGEM: GET + render na tabela
   ========================= */

function showBox(idToShow) {                                            // Controla qual tabela está visível
  document.querySelectorAll(".box-lista").forEach(box => box.hidden = true); // Esconde todas as boxes
  document.getElementById(idToShow).hidden = false;                     // Mostra apenas a solicitada
}

function renderEmpresas(items) {                                        // Renderiza linhas da tabela de empresas
  const tbody = document.getElementById("tbodyEmpresas");               // Seleciona o <tbody> de empresas
  tbody.innerHTML = "";                                                 // Limpa conteúdo anterior
  items.forEach(emp => {                                                // Percorre os itens recebidos da API
    const tr = document.createElement("tr");                            // Cria uma nova linha
    tr.innerHTML = `                                                   
      <td>${emp.razao_social ?? ""}</td>                               
      <td>${emp.cnpj ?? ""}</td>                                      
      <td>${emp.endereco ?? ""}</td>                                  
      <td>${emp.email ?? ""}</td>                                      
      <td>${emp.responsavel ?? ""}</td>                               
    `;
    tbody.appendChild(tr);                                              // Anexa a linha ao corpo da tabela
  });
}

function renderProdutos(items) {                                        // Renderiza linhas da tabela de produtos
  const tbody = document.getElementById("tbodyProdutos");               // Seleciona o <tbody> de produtos
  tbody.innerHTML = "";                                                 // Limpa conteúdo anterior
  items.forEach(p => {                                                  // Percorre os itens recebidos
    const tr = document.createElement("tr");                            // Cria uma nova linha
    tr.innerHTML = `                                                   
      <td>${p.nome ?? ""}</td>                                         
      <td>${p.codigo ?? ""}</td>                                       
      <td>${p.estoque ?? ""}</td>                                      
      <td>${p.categoria ?? ""}</td>                                    
      <td>${p.marca ?? ""}</td>                                        
      <td>${p.valor ?? ""}</td>                                        
      <td>${p.validade ?? ""}</td>                                     
    `;
    tbody.appendChild(tr);                                              // Anexa a linha ao corpo da tabela
  });
}

function renderOfertas(items) {                                         // Renderiza linhas da tabela de ofertas
  const tbody = document.getElementById("tbodyOfertas");                // Seleciona o <tbody> de ofertas
  tbody.innerHTML = "";                                                 // Limpa conteúdo anterior
  items.forEach(o => {                                                  // Percorre os itens recebidos
    const tr = document.createElement("tr");                            // Cria uma nova linha
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
    tbody.appendChild(tr);                                              // Anexa a linha ao corpo da tabela
  });
}

async function carregarEmpresas() {                                     // Carrega empresas da API e renderiza
  showBox("boxEmpresas");                                               // Mostra a tabela de empresas
  const data = await apiGet(ENDPOINTS.empresas);                        // Busca dados via GET
  renderEmpresas(data);                                                 // Renderiza no DOM
}
async function carregarProdutos() {                                     // Carrega produtos da API e renderiza
  showBox("boxProdutos");                                               // Mostra a tabela de produtos
  const data = await apiGet(ENDPOINTS.produtos);                        // Busca dados via GET
  renderProdutos(data);                                                 // Renderiza no DOM
}
async function carregarOfertas() {                                      // Carrega ofertas da API e renderiza
  showBox("boxOfertas");                                                // Mostra a tabela de ofertas
  const data = await apiGet(ENDPOINTS.ofertas);                         // Busca dados via GET
  renderOfertas(data);                                                  // Renderiza no DOM
}

document.getElementById("btnVerEmpresas")?.addEventListener("click", carregarEmpresas); // Botão mostra empresas
document.getElementById("btnVerProdutos")?.addEventListener("click", carregarProdutos); // Botão mostra produtos
document.getElementById("btnVerOfertas")?.addEventListener("click", carregarOfertas);   // Botão mostra ofertas

/* =========================
   SUBMIT dos formulários (POST real)
   ========================= */
/*
Mapeia placeholders -> chaves do backend.
Se mudar o texto do placeholder no HTML, ajuste aqui.
*/
const MAP_KEYS = {                                                     // Mapa para transformar placeholders em chaves JSON
  modalEmpresa: {                                                      // Campos do formulário de empresa
    "Razão social": "razao_social",                                    // Placeholder -> chave backend
    "CNPJ": "cnpj",                                                    // Placeholder -> chave backend
    "Endereço": "endereco",                                            // Placeholder -> chave backend
    "E-mail empresarial": "email",                                     // Placeholder -> chave backend
    "Responsável": "responsavel",                                      // Placeholder -> chave backend
  },
  modalProduto: {                                                      // Campos do formulário de produto
    "Produto": "nome",                                                 // Placeholder -> chave backend
    "Código de produto": "codigo",                                     // Placeholder -> chave backend
    "Estoque": "estoque",                                              // Placeholder -> chave backend
    "Categoria": "categoria",                                          // Placeholder -> chave backend
    "Marca": "marca",                                                  // Placeholder -> chave backend
    "Valor": "valor",                                                  // Placeholder -> chave backend
    "Validade": "validade",                                            // Placeholder -> chave backend
  },
  modalOferta: {                                                       // Campos do formulário de oferta
    "Produto": "produto",                                              // Placeholder -> chave backend
    "Marca": "marca",                                                  // Placeholder -> chave backend
    "Código do produto": "codigo",                                     // Placeholder -> chave backend
    "Estoque": "estoque",                                              // Placeholder -> chave backend
    "Categoria": "categoria",                                          // Placeholder -> chave backend
    "Valor": "valor",                                                  // Placeholder -> chave backend
    "Validade": "validade",                                            // Placeholder -> chave backend
    "Data início": "data_inicio",                                      // Placeholder -> chave backend
    "Data fim": "data_fim",                                            // Placeholder -> chave backend
  }
};

// Converte números onde fizer sentido
function coerceValue(key, value) {                                     // Normaliza valores do formulário
  const numeric = ["estoque", "valor"];                                // Campos numéricos que aceitam número
  if (numeric.includes(key)) {                                         // Se a chave é numérica...
    const n = Number((value ?? "").toString().replace(",", "."));      // Converte string para número (troca vírgula por ponto)
    return isNaN(n) ? 0 : n;                                           // Se não for número, volta 0; senão o valor convertido
  }
  return (value ?? "").trim();                                         // Para strings, remove espaços excedentes
}

document.querySelectorAll(".modal form").forEach(form => {             // Seleciona todos os forms dos modais
  form.addEventListener("submit", async (e) => {                       // Adiciona listener de submit assíncrono
    e.preventDefault();                                                // Evita reload da página
    const modal = form.closest(".modal");                              // Encontra o modal pai do formulário
    const modalId = modal.id;                                          // Lê o id do modal (modalEmpresa|modalProduto|modalOferta)
    const map = MAP_KEYS[modalId];                                     // Recupera o mapa de placeholders -> chaves
    const inputs = form.querySelectorAll("input");                      // Coleta todos os inputs do formulário
    let vazio = false;                                                 // Flag para validar campos vazios
    const payload = {};                                                // Objeto que será enviado no POST
    inputs.forEach(inp => {                                            // Itera sobre inputs
      const ph = inp.getAttribute("placeholder") || "";                // Lê o placeholder atual
      const key = map?.[ph];                                           // Mapeia o placeholder para a chave do backend
      if ((inp.value ?? "").trim() === "") {                           // Se o campo está vazio...
        inp.style.border = "2px solid #c0392b";                        // ...destaca em vermelho
        vazio = true;                                                  // ...marca que há campos vazios
      } else {                                                         // Senão (preenchido)...
        inp.style.border = "2px solid #59e1a1";                        // ...destaca em verde
      }
      if (key) payload[key] = coerceValue(key, inp.value);             // Se há chave mapeada, coloca no payload já normalizado
    });
    if (vazio) { mostrarToast("Por favor, preencha todos os campos obrigatórios.", "erro"); return; } // Se vazio, alerta e para
    // Decide endpoint
    let endpoint = "";                                                 // Inicializa a variável de endpoint
    if (modalId === "modalEmpresa") endpoint = ENDPOINTS.empresas;     // Se é empresa, usa /api/empresas
    else if (modalId === "modalProduto") endpoint = ENDPOINTS.produtos;// Se é produto, usa /api/produtos
    else if (modalId === "modalOferta") endpoint = ENDPOINTS.ofertas;  // Se é oferta, usa /api/ofertas
    const ok = await apiPost(endpoint, payload);                       // Envia o POST para o backend
    if (ok && ok.ok) {                                                 // Se a API retornou sucesso...
      mostrarToast("Cadastro salvo com sucesso!", "sucesso");          // Mostra mensagem de sucesso
      form.reset();                                                    // Limpa o formulário
      inputs.forEach(i => i.style.border = "none");                    // Remove bordas de validação
      fecharModal(modalId);                                            // Fecha o modal correspondente
      // Atualiza lista correspondente
      if (modalId === "modalEmpresa") carregarEmpresas();              // Se cadastrou empresa, recarrega listagem
      if (modalId === "modalProduto") carregarProdutos();              // Se cadastrou produto, recarrega listagem
      if (modalId === "modalOferta")  carregarOfertas();               // Se cadastrou oferta, recarrega listagem
    }
  });
});

// Dica: você pode chamar uma lista ao abrir a página
// carregarEmpresas();                                                 // Descomente se quiser carregar empresas automaticamente

/* =========================
   MENU: MARCAR ITEM ATIVO
   ========================= */
const menuLinks = document.querySelectorAll(".menu-lateral a");        // Seleciona todos os links do menu lateral

menuLinks.forEach(link => {                                            // Para cada link...
  link.addEventListener("click", function() {                          // ...escuta clique
    menuLinks.forEach(l => l.classList.remove("active"));              // Remove 'active' de todos
    this.classList.add("active");                                      // Adiciona 'active' somente no clicado
  });
});

// Marca automaticamente o link do menu referente à página atual
document.querySelectorAll(".menu-lateral a").forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add("active");
  }
});
