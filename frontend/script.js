/* =========================
   MENU LATERAL
   ========================= */
const btnMenu = document.getElementById("btnMenu");
const menuLateral = document.getElementById("menuLateral");
const overlay = document.getElementById("overlay");
let menuAberto = false;

const BASE_URL = "https://ofertmatch.onrender.com";
const ENDPOINTS = {
  empresas: `${BASE_URL}/api/empresas`,
  produtos: `${BASE_URL}/api/produtos`,
  ofertas:  `${BASE_URL}/api/ofertas`,
  health:   `${BASE_URL}/api/health`,
};

function abrirMenu(){ menuLateral.style.left = "0"; overlay.style.display = "block"; btnMenu?.setAttribute("aria-expanded","true"); menuAberto = true; }
function fecharMenu(){ menuLateral.style.left = "-250px"; overlay.style.display = "none"; btnMenu?.setAttribute("aria-expanded","false"); menuAberto = false; }
btnMenu?.addEventListener("click", ()=> menuAberto ? fecharMenu() : abrirMenu());
overlay?.addEventListener("click", fecharMenu);
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && menuAberto){ fecharMenu(); btnMenu?.focus(); }});

/* =========================
   MODAIS
   ========================= */
function abrirModal(id){
  const el = document.getElementById(id); if(!el) return;
  el.style.display = "flex"; el.offsetHeight; el.classList.add("show"); el.setAttribute("aria-hidden","false");
  const firstInput = el.querySelector("input,select,textarea,button.salvar"); if(firstInput) firstInput.focus();
  function escHandler(ev){ if(ev.key==="Escape"){ fecharModal(id); document.removeEventListener("keydown", escHandler);} }
  document.addEventListener("keydown", escHandler);
}
function fecharModal(id){
  const el = document.getElementById(id); if(!el) return;
  el.classList.remove("show"); setTimeout(()=>{ el.style.display="none"; el.setAttribute("aria-hidden","true"); },300);
}

document.querySelectorAll(".card").forEach(card=>{
  card.addEventListener("click", ()=> abrirModal(card.getAttribute("data-open")));
});
document.querySelectorAll(".fechar, .cancelar").forEach(btn=>{
  btn.addEventListener("click", ()=> fecharModal(btn.getAttribute("data-modal")));
});
window.addEventListener("click", (e)=>{
  if(e.target.classList.contains("modal")){
    e.target.style.display = "none"; e.target.setAttribute("aria-hidden","true");
  }
});

/* =========================
   TOAST
   ========================= */
function mostrarToast(msg, tipo="sucesso"){
  const t = document.getElementById("toast"); if(!t) return;
  t.className = "toast"; t.classList.add(tipo); t.textContent = msg; t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), 3000);
}

/* =========================
   API helpers
   ========================= */
async function apiGet(url){
  try{
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if(!r.ok || j.ok===false) throw new Error(j.msg || "Erro ao buscar dados.");
    return j.data || [];
  }catch(e){ console.error(e); mostrarToast(e.message || "Falha de conexão.", "erro"); return []; }
}
async function apiPost(url, body){
  try{
    const r = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const txt = await r.text(); let j; try{ j=JSON.parse(txt);}catch{ j={ ok:false, msg: txt || "Resposta não-JSON"}; }
    if(!r.ok || j.ok===false) throw new Error(j.msg || `Erro HTTP ${r.status}`);
    return j;
  }catch(e){ console.error("POST error:", e); mostrarToast(e.message || "Falha ao enviar.", "erro"); return null; }
}
async function apiPut(url, body){
  try{
    const r = await fetch(url, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if(!r.ok || j.ok===false) throw new Error(j.msg || `Erro HTTP ${r.status}`);
    return j;
  }catch(e){ console.error("PUT error:", e); mostrarToast(e.message || "Falha ao atualizar.", "erro"); return null; }
}
async function apiDelete(url){
  try{
    const r = await fetch(url, { method:"DELETE" });
    const j = await r.json();
    if(!r.ok || j.ok===false) throw new Error(j.msg || `Erro HTTP ${r.status}`);
    return j;
  }catch(e){ console.error("DELETE error:", e); mostrarToast(e.message || "Falha ao excluir.", "erro"); return null; }
}

/* =========================
   LISTAS + RENDER
   ========================= */
function showBox(idToShow){
  document.querySelectorAll(".box-lista").forEach(b=> b.hidden=true);
  const box = document.getElementById(idToShow); if(box) box.hidden=false;
}
function actionsCell(tipo, item){
  return `
    <td>
      <button class="btn-edit" data-tipo="${tipo}" data-id="${item._id}">Editar</button>
      <button class="btn-del"  data-tipo="${tipo}" data-id="${item._id}">Excluir</button>
    </td>
  `;
}
function renderEmpresas(items){
  const tbody = document.getElementById("tbodyEmpresas"); if(!tbody) return;
  tbody.innerHTML = "";
  items.forEach(emp=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.razao_social ?? ""}</td>
      <td>${emp.cnpj ?? ""}</td>
      <td>${emp.endereco ?? ""}</td>
      <td>${emp.email ?? ""}</td>
      <td>${emp.responsavel ?? ""}</td>
      ${actionsCell("empresas", emp)}
    `;
    tbody.appendChild(tr);
  });
  bindRowActions();
}
function renderProdutos(items){
  const tbody = document.getElementById("tbodyProdutos"); if(!tbody) return;
  tbody.innerHTML = "";
  items.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nome ?? ""}</td>
      <td>${p.codigo ?? ""}</td>
      <td>${p.estoque ?? ""}</td>
      <td>${p.categoria ?? ""}</td>
      <td>${p.marca ?? ""}</td>
      <td>${p.valor ?? ""}</td>
      <td>${p.validade ?? ""}</td>
      ${actionsCell("produtos", p)}
    `;
    tbody.appendChild(tr);
  });
  bindRowActions();
}
function renderOfertas(items){
  const tbody = document.getElementById("tbodyOfertas"); if(!tbody) return;
  tbody.innerHTML = "";
  items.forEach(o=>{
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
      ${actionsCell("ofertas", o)}
    `;
    tbody.appendChild(tr);
  });
  bindRowActions();
}
async function carregarEmpresas(){ showBox("boxEmpresas");  renderEmpresas(await apiGet(ENDPOINTS.empresas)); }
async function carregarProdutos(){ showBox("boxProdutos");  renderProdutos(await apiGet(ENDPOINTS.produtos)); }
async function carregarOfertas(){  showBox("boxOfertas");   renderOfertas( await apiGet(ENDPOINTS.ofertas)); }

document.getElementById("btnVerEmpresas")?.addEventListener("click", carregarEmpresas);
document.getElementById("btnVerProdutos")?.addEventListener("click", carregarProdutos);
document.getElementById("btnVerOfertas")?.addEventListener("click", carregarOfertas);

/* =========================
   EDIT/DELETE – listeners por linha
   ========================= */
function bindRowActions(){
  document.querySelectorAll(".btn-edit").forEach(btn=>{
    btn.onclick = ()=> handleEdit(btn.dataset.tipo, btn.dataset.id);
  });
  document.querySelectorAll(".btn-del").forEach(btn=>{
    btn.onclick = ()=> handleDelete(btn.dataset.tipo, btn.dataset.id);
  });
}
function endpointByTipo(tipo){
  if (tipo==="empresas") return ENDPOINTS.empresas;
  if (tipo==="produtos") return ENDPOINTS.produtos;
  return ENDPOINTS.ofertas;
}
function fillForm(formEl, obj){
  formEl.querySelectorAll("[data-field]").forEach(inp=>{
    const k = inp.getAttribute("data-field");
    let v = (obj?.[k] ?? "");
    if (k === "cnpj") {
      v = maskCNPJ(v);
    }
    if (k === "valor") {
      if (typeof v === "number") {
        v = (v.toFixed(2)).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      } else {
        v = maskCurrencyBR(v);
      }
    }
    inp.value = v;
  });
}
function findItemRendered(tipo, id){
  return apiGet(endpointByTipo(tipo)).then(arr => arr.find(x => x._id === id));
}
async function handleEdit(tipo, id){
  const item = await findItemRendered(tipo, id);
  if (!item){ mostrarToast("Registro não encontrado.", "erro"); return; }
  if (tipo==="empresas"){
    const form = document.getElementById("formEmpresa");
    form.dataset.mode = "edit"; form.dataset.id = id; fillForm(form, item); abrirModal("modalEmpresa");
  } else if (tipo==="produtos"){
    const form = document.getElementById("formProduto");
    form.dataset.mode = "edit"; form.dataset.id = id; fillForm(form, item); abrirModal("modalProduto");
  } else {
    const form = document.getElementById("formOferta");
    form.dataset.mode = "edit"; form.dataset.id = id; fillForm(form, item); abrirModal("modalOferta");
  }
}
async function handleDelete(tipo, id){
  if (!confirm("Tem certeza que deseja excluir este registro?")) return;
  const ep = endpointByTipo(tipo) + "/" + id;
  const ok = await apiDelete(ep);
  if (ok && ok.ok){
    mostrarToast("Excluído com sucesso!", "sucesso");
    if (tipo==="empresas") carregarEmpresas();
    else if (tipo==="produtos") carregarProdutos();
    else carregarOfertas();
  }
}

/* =========================
   FORM SUBMIT (POST/PUT)
   ========================= */
function coerceValueSmart(field, value){
  const numInt = ["estoque"];
  const numDec = ["valor"];
  if (numInt.includes(field)){ const n = parseInt(value,10); return isNaN(n)?0:n; }
  if (numDec.includes(field)){
    // remove pontos (milhar) e muda vírgula para ponto
    const clean = (value??"").toString().replace(/\./g,'').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n)?0:n;
  }
  if (field==="cnpj"){ return (value??"").replace(/\D/g,"").slice(0,14); }
  return (value??"").trim();
}
function payloadFromForm(formEl){
  const payload = {};
  formEl.querySelectorAll("[data-field]").forEach(inp=>{
    const key = inp.getAttribute("data-field");
    payload[key] = coerceValueSmart(key, inp.value);
  });
  return payload;
}

/* ======== Máscaras + Validadores ======== */
const onlyDigits = (v='') => v.replace(/\D+/g,'');
function maskCNPJ(v){
  const d = onlyDigits(v).slice(0,14);
  let out = '';
  if (d.length>0) out = d.slice(0,2);
  if (d.length>=3) out += '.' + d.slice(2,5);
  if (d.length>=6) out += '.' + d.slice(5,8);
  if (d.length>=9) out += '/' + d.slice(8,12);
  if (d.length>=13) out += '-' + d.slice(12,14);
  return out;
}
function maskCurrencyBR(v){
  const d = onlyDigits(v).slice(0,12);
  const pad = d.padStart(3,'0');
  const inteiro = pad.slice(0,-2);
  const cent = pad.slice(-2);
  const inteiroFmt = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return `${inteiroFmt},${cent}`;
}
function bindMaskByDataField(field, fn){
  document.querySelectorAll(`[data-field="${field}"]`).forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const start = inp.selectionStart;
      const before = inp.value;
      inp.value = fn(inp.value);
      const delta = inp.value.length - before.length;
      const pos = Math.max(0, (start||0)+delta);
      inp.setSelectionRange(pos, pos);
    });
  });
}
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||'').trim()); }
function isValidCNPJ(formatted){
  const c = onlyDigits(formatted);
  if (c.length !== 14) return false;
  if (/^(\d)\1+$/.test(c)) return false;
  const calcDV = (base) => {
    let size = base.length, pos = size - 7, sum = 0;
    for (let i = size; i >= 1; i--) { sum += base[size - i] * pos--; if (pos < 2) pos = 9; }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const dv1 = calcDV(c.substring(0,12));
  const dv2 = calcDV(c.substring(0,12) + dv1);
  return c.endsWith(`${dv1}${dv2}`);
}
function isPositiveMoneyBR(mask){
  const n = Number((mask||'').replace(/\./g,'').replace(',','.'));
  return !isNaN(n) && n > 0;
}
function parseISO(d){
  if (!d) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return null;
  const [_, y, mo, da] = m.map(Number);
  const dt = new Date(y, mo-1, da);
  return (dt && dt.getMonth()===mo-1 && dt.getDate()===da) ? dt : null;
}
function setFieldError(formEl, field, msg){
  const inp = formEl.querySelector(`[data-field="${field}"]`);
  if (inp) inp.style.border = msg ? "2px solid #c0392b" : "2px solid #59e1a1";
  const slot = formEl.querySelector(`[data-error-for="${field}"]`);
  if (slot) slot.textContent = msg || "";
}
function clearFieldErrors(formEl){
  formEl.querySelectorAll("[data-field]").forEach(inp => inp.style.border="none");
  formEl.querySelectorAll(".field-error").forEach(s => s.textContent="");
}

/* ativa máscaras quando a página carrega */
document.addEventListener("DOMContentLoaded", ()=>{
  bindMaskByDataField("cnpj", maskCNPJ);
  bindMaskByDataField("valor", maskCurrencyBR);
});

/* valida + envia */
async function submitGeneric(formEl, endpoint, onAfterOk){
  const btn = formEl.querySelector(".salvar"); btn?.setAttribute("disabled","disabled"); if(btn) btn.textContent="Salvando...";
  try{
    // obrigatórios visuais
    let vazio=false;
    clearFieldErrors(formEl);
    formEl.querySelectorAll("[data-field][required]").forEach(inp=>{
      if(!inp.value.trim()){ inp.style.border="2px solid #c0392b"; vazio=true; }
      else { inp.style.border="2px solid #59e1a1"; }
    });

    // regras específicas
    if (formEl.id === "formEmpresa"){
      const cnpj  = formEl.querySelector('[data-field="cnpj"]')?.value || '';
      const email = formEl.querySelector('[data-field="email"]')?.value || '';
      if (!isValidCNPJ(cnpj)){ setFieldError(formEl, "cnpj", "CNPJ inválido."); vazio = true; }
      if (!isEmail(email)){ setFieldError(formEl, "email", "E-mail inválido."); vazio = true; }
    }
    if (formEl.id === "formProduto"){
      const vMask = formEl.querySelector('[data-field="valor"]')?.value || '';
      if (!isPositiveMoneyBR(vMask)){ setFieldError(formEl, "valor", "Informe um valor positivo."); vazio = true; }
    }
    if (formEl.id === "formOferta"){
      const vMask = formEl.querySelector('[data-field="valor"]')?.value || '';
      if (!isPositiveMoneyBR(vMask)){ setFieldError(formEl, "valor", "Informe um valor positivo."); vazio = true; }
      const dIni = parseISO(formEl.querySelector('[data-field="data_inicio"]')?.value || '');
      const dFim = parseISO(formEl.querySelector('[data-field="data_fim"]')?.value || '');
      const dVal = parseISO(formEl.querySelector('[data-field="validade"]')?.value || '');
      if (!dIni){ setFieldError(formEl, "data_inicio", "Data inicial inválida."); vazio = true; }
      if (!dFim){ setFieldError(formEl, "data_fim", "Data final inválida."); vazio = true; }
      if (dIni && dFim && dFim < dIni){ setFieldError(formEl, "data_fim", "Fim não pode ser antes do início."); vazio = true; }
      if (dVal && dIni && dVal < dIni){ setFieldError(formEl, "validade", "Validade ≥ início."); vazio = true; }
      if (dVal && dFim && dVal < dFim){ setFieldError(formEl, "validade", "Validade ≥ fim."); vazio = true; }
    }

    if (vazio){ mostrarToast("Corrija os campos destacados.", "erro"); return; }

    const payload = payloadFromForm(formEl);
    const mode = formEl.dataset.mode || "create";
    const id   = formEl.dataset.id || "";
    let res = null;

    if (mode==="edit" && id){
      res = await apiPut(`${endpoint}/${id}`, payload);
    } else {
      res = await apiPost(endpoint, payload);
    }

    if (res && (res.ok === true || res.ok === "true")){
      mostrarToast(mode==="edit" ? "Atualizado com sucesso!" : "Cadastro salvo com sucesso!", "sucesso");
      formEl.reset();
      formEl.querySelectorAll("[data-field]").forEach(i=> i.style.border="none");
      formEl.dataset.mode = "create"; formEl.dataset.id = "";
      const modal = formEl.closest(".modal"); if(modal) fecharModal(modal.id);
      onAfterOk && onAfterOk();
    }
  }catch(e){
    mostrarToast(e.message || "Erro ao salvar.", "erro");
  }finally{
    btn?.removeAttribute("disabled"); if(btn) btn.textContent="Salvar";
  }
}

/* listeners dos 3 forms */
document.getElementById("formEmpresa")?.addEventListener("submit", (e)=>{
  e.preventDefault(); submitGeneric(e.currentTarget, ENDPOINTS.empresas, carregarEmpresas);
});
document.getElementById("formProduto")?.addEventListener("submit", (e)=>{
  e.preventDefault(); submitGeneric(e.currentTarget, ENDPOINTS.produtos, carregarProdutos);
});
document.getElementById("formOferta")?.addEventListener("submit", (e)=>{
  e.preventDefault(); submitGeneric(e.currentTarget, ENDPOINTS.ofertas, carregarOfertas);
});

/* =========================
   MENU ativo
   ========================= */
const menuLinks = document.querySelectorAll(".menu-lateral a");
menuLinks.forEach(link=>{
  link.addEventListener("click", function(){
    menuLinks.forEach(l=> l.classList.remove("active"));
    this.classList.add("active");
  });
});
document.querySelectorAll(".menu-lateral a").forEach(link=>{
  if (link.href === window.location.href) link.classList.add("active");
});

/* =========================
   HEALTH CHECK (opcional)
   ========================= */
async function checkApi(){
  const el = document.getElementById("api-status"); if(!el) return;
  try{
    const r = await fetch(ENDPOINTS.health, { cache:"no-store" });
    const d = await r.json();
    el.textContent = d?.ok ? "API online ✅" : "API respondeu, mas sem OK";
  }catch{ el.textContent = "API offline (Render hibernado?) ⏳"; }
}
document.addEventListener("DOMContentLoaded", checkApi);
