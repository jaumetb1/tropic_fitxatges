import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let timerToken = null;
let dataImpresio=null;
function imprimirContingutHTML(html) {
  const finestra = window.open("", "_blank", "width=600,height=600");
  if (!finestra) {
    alert("❌ No s'ha pogut obrir la finestra d'impressió");
    return;
  }

  finestra.document.title = "Tiquet";
  finestra.document.body.innerHTML = `
    <html>
      <head>
        <style>
          body { font-family: monospace; padding: 10px;}
          h3 { margin-bottom: 0.5em; }
          hr { margin: 1em 0; }
          
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  finestra.document.close();
  finestra.focus();
  finestra.print();
}

async function imprimirFitxatges() {

   // 🔁 Substitueix amb el teu ID real

  const avui = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
   const dataConsulta = dataImpresio || avui; // Si no hi ha dataImpresio, usa avui
  const { data, error } = await supabase
    .from("fitxatges")
    .select("nom, data, hora, tipus")
    .eq("data", dataConsulta)
    .eq("id_empresa", ID_EMPRESA)
    .order("hora", { ascending: true });

  if (error) {
    console.error("❌ Error obtenint fitxatges:", error.message);
    return;
  }

  // Agrupar per nom
  const agrupats = {};
  data.forEach((f) => {
    if (!agrupats[f.nom]) agrupats[f.nom] = {};
    agrupats[f.nom][f.tipus] = f.hora;
  });

  // Generar HTML del tiquet
  let html = `<h3>🧾 Fitxatges del dia</h3>`;
  html += `<p>📅 Data: ${dataConsulta}</p><hr>`;

  Object.keys(agrupats).forEach((nom) => {
    const entrada = agrupats[nom].entrada || "—";
    const sortida = agrupats[nom].sortida || "—";
    html += `
      <p><strong>👤 ${nom}</strong></p>
      <p>Entrada: ${formatHora(entrada)}</p>
      <p>Sortida: ${formatHora(sortida)}</p>
      <hr>
    `;
  });

  imprimirContingutHTML(html);
}

function formatHora(horaString) {
  if (!horaString || horaString === "—") return "—";
  const [h, m] = horaString.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}



document.getElementById("btnImprimir").addEventListener("click", imprimirFitxatges);

async function getTempsCaducitatToken(supabase) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const payload = JSON.parse(atob(session.access_token.split(".")[1]));
    const expiryTimestamp = payload.exp * 1000; // en mil·lisegons
    const tempsRestant = expiryTimestamp - Date.now();

    return Math.floor(tempsRestant / 1000); // Retorna en segons
  } catch (err) {
    console.error("❌ Error obtenint caducitat del token:", err);
    return null;
  }
}

async function iniciarCompteEnrereToken(supabase) {
  if (timerToken) clearInterval(timerToken); // Evita duplicats

  const resposta = await supabase.auth.getSession();
  const token = resposta?.data?.session?.access_token;
  if (!token) return;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const tempsFinal = payload.exp * 1000;

  const span = document.getElementById("segonsRestants");
  const barra = document.getElementById("barraToken");

  function actualitzarBarra() {
    const tempsRestant = tempsFinal - Date.now();
    const segons = Math.floor(tempsRestant / 1000);
    span.textContent = segons > 0 ? formatTemps(segons) : "Caducat";

    const totalDurada = tempsFinal - payload.iat * 1000;
    const percentatge = Math.max(0, Math.floor((tempsRestant / totalDurada) * 100));
    barra.style.width = percentatge + "%";
    barra.style.background = percentatge > 30 ? "#4caf50" : "#ff9800";

    if (segons <= 0) {
      barra.style.background = "#f44336";
      clearInterval(timerToken);
    }
  }

  actualitzarBarra();
  timerToken = setInterval(actualitzarBarra, 1000);
}


function formatTemps(segonsTotals) {
  const minutes = Math.floor(segonsTotals / 60);
  const seconds = segonsTotals % 60;

  // Afegeix zero davant si cal
  const m = minutes.toString().padStart(2, "0");
  const s = seconds.toString().padStart(2, "0");

  return `${m}:${s}`;
}
let segonsRestants = 3600;
console.log("🕒 El token caduca en", segonsRestants, "segons");
//if (supabase) {supabase.from("fitxatges").select().limit(1).then(({ data, error }) => {
 //     if (error) {
 //       console.error("❌ Supabase connectat, però la consulta ha fallat:",error.message);
 //     } else {console.log("✅ Connexió OK");}
 //   });
//}

let esMobil=false;
let intervalSessio;
function crearSpanHora(text) {
  const span = document.createElement("span");
  span.className = "span-com-input me-2";
  span.textContent = text || "--:--";
  return span;
}
// 👆 Tancar el modal tocant fora
window.addEventListener("click", (event) => {
  const modal = document.getElementById("modalSessio");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
// 🎛️ Inicialitza el contenidor visual
function inicialitzarTaulerDebug() {
  const tauler = document.getElementById("taulerDebug");
  tauler.style.position = "fixed";
  tauler.style.bottom = "40px";
  tauler.style.left = "0";
  tauler.style.width = "30%";
  tauler.style.maxHeight = "200px";
  tauler.style.overflowY = "auto";
  tauler.style.background = "#111";
  tauler.style.color = "#0f0";
  tauler.style.fontFamily = "monospace";
  tauler.style.fontSize = "13px";
  tauler.style.padding = "8px";
  tauler.style.zIndex = "9999";
  tauler.innerHTML = "<strong>🎛️ Tauler de diagnòstic:</strong><br>";
}

// ➕ Afegeix línia visual al tauler
function afegirLiniaTauler(missatge,color="white") {
  const tauler = document.getElementById("taulerDebug");
  const div = document.createElement("div");
  div.style.color=color;
  div.textContent = "› " + missatge;
  tauler.appendChild(div);
  tauler.scrollTop = tauler.scrollHeight;
}

// 🔄 Alterna visibilitat del tauler
function toggleTauler() {
  const tauler = document.getElementById("taulerDebug");
  const boto = document.getElementById("btnToggleTauler");
  if (tauler.style.display === "none") {
    tauler.style.display = "block";
    boto.textContent = "❌ Tancar tauler";
  } else {
    tauler.style.display = "none";
    boto.textContent = "🔍 Mostrar tauler";
  }
}

// 🔍 Dispositiu
function detectarDispositiu() {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "📲 Tauleta";
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "📱 Mòbil";
  if (/Windows|Macintosh|Linux/i.test(ua)) return "🖥️ PC o portàtil";
  return "❓ Tipus desconegut";
}
// 🔍 Dispositiu
function detectarDispositiuMobil() {
  const ua = navigator.userAgent;

  if (/Tablet|iPad/i.test(ua)) return false;
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return true;
  if (/Windows|Macintosh|Linux/i.test(ua)) return false;
  return false;
}
// 🌐 Navegador
function detectarNavegador() {
  const ua = navigator.userAgent;
if (ua.includes("Edg")) return "🔷 Edge";
  if (ua.includes("Chrome")) return "🌐 Chrome";
  if (ua.includes("Firefox")) return "🦊 Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "🍎 Safari";
  
  return "❓ Navegador desconegut";
}

// 🧪 Compatibilitat Supabase
function comprovarCompatibilitatSupabase() {
  return window.fetch && window.Promise && window.localStorage && window.TextEncoder;
}
function detectarSistemaOperatiu() {
  const ua = navigator.userAgent;
if(ua)return navigator.userAgent;
  if (ua.includes("Windows")) return "🪟 Windows";
  if (ua.includes("Macintosh")) return "🍎 macOS";
  if (ua.includes("Linux")) return "🐧 Linux";
  if (ua.includes("Android")) return "🤖 Android";
  if (ua.includes("like Mac")) return "📱 iOS";
  return "❓ Desconegut";
}
function detectarTactil() {
  return navigator.maxTouchPoints > 0 ? "🖐️ Tàctil" : "🖱️ No tàctil";
}
function detectarResolucio() {
  const width=window.screen.width;
  const height=window.screen.height;
  const position=width>height?"Horitzontal":"Verical";
  return `${window.screen.width}×${window.screen.height} px ${position}`;
}


async function testSupabaseSessio() {
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Error al recuperar sessió:", error.message);
      afegirDebugVisual("❌ Error al recuperar sessió: " + error.message);
      afegirLiniaTauler("❌ Error al recuperar sessió: " + error.message,"red");
    } else if (session) {
      console.log("✅ Sessió activa detectada:", session.user.email);
      afegirDebugVisual("✅ Sessió activa: " + session.user.email);
        afegirLiniaTauler("✅ Sessió activa: " + session.user.email,"green");
    } else {
      console.warn("🚫 No hi ha sessió activa.");
      afegirDebugVisual("⚠️ Supabase accessible, però no hi ha sessió iniciada.");
           afegirLiniaTauler("⚠️ Supabase accessible, però no hi ha sessió iniciada.","yellow");
    }
  } catch (e) {
    console.error("🧨 Error general en el test:", e);
    afegirDebugVisual("❌ Error inesperat. Mira la consola.");
    afegirLiniaTauler("❌ Error inesperat. Mira la consola.");
  }
}

function afegirDebugVisual(text) {
if(!esMobil){
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.bottom = "0";
  div.style.left = "0";
  div.style.background = "#222";
  div.style.color = "#fff";
  div.style.padding = "10px";
  div.style.fontSize = "14px";
  div.style.zIndex = "9999";
  div.textContent = text;
  document.body.appendChild(div);}
}

function actualitzarNumeroCercle(valor1,valor2) {
  const icona = document.getElementById("cercle-contador-entrada");
  icona.className = `bi bi-${valor1}-circle`;
   const icona1 = document.getElementById("cercle-contador-sortida");
  icona1.className = `bi bi-${valor2}-circle`;
}

function ampliarCalendari() {
  document.getElementById("panellLateral").classList.remove("col-md-4");
  document.getElementById("panellLateral").classList.add("col-md-2");
  document.getElementById("panellEsquerra").classList.remove("col-md-8");
  document.getElementById("panellEsquerra").classList.add("col-md-10");

  document.getElementById("ampliar").style.display = "none";
  document.getElementById("disminuir").style.display = "block";
  document.querySelector(".fc-dayGridMonth-button")?.click();
  document.querySelector(".fc-today-button")?.removeAttribute("disabled");
}
function disminuirCalendari() {
  document.getElementById("panellLateral").classList.remove("col-md-2");
  document.getElementById("panellLateral").classList.add("col-md-4");
  document.getElementById("panellEsquerra").classList.remove("col-md-10");
  document.getElementById("panellEsquerra").classList.add("col-md-8");
  document.getElementById("ampliar").style.display = "block";
  document.getElementById("disminuir").style.display = "none";
  document.querySelector(".fc-dayGridMonth-button")?.click();
  document.querySelector(".fc-today-button")?.removeAttribute("disabled");
}
let ID_EMPRESA;
let mesSeleccionat;



let usuaris = [];
let users = [];
let fitxatges = [];
let empresa={};
let calendar;

let numeroDeFitxatges = 0;
let fitxatgesDia = [];
let dataActualModal = null;
let mapaNomIdUsuari = {};
async function carregaEmpresa(email) {
  if (!email) return;

  try {
    const { data, error } = await supabase
      .from("empreses")
      .select("*")
      .eq("email", email)
      .limit(1); // Opcional, per assegurar que només ve 1 resultat

    if (error || !data || data.length === 0) {
      console.error("❌ No s'ha trobat cap empresa amb aquest email:", error);
      return null;
    }

    empresa = data[0]; // ✅ primer resultat
    ID_EMPRESA = empresa.id;

    //console.log("✅ Empresa carregada:", empresa);
    return ID_EMPRESA;

  } catch (err) {
    console.error("💥 Error inesperat a carregaEmpresa:", err);
    return null;
  }
}

//document.getElementById("loginBtn").addEventListener("click", iniciarSessio);
async function carregaUsers() {
  if (!ID_EMPRESA) return;
  try {
    const { data, error } = await supabase
      .from("usuaris")
      .select("*")
      .eq("id_empresa", ID_EMPRESA); // 🎯 filtre aplicat

    if (error) {
      console.error("❌ Error carregant usuaris:", error);
      return [];
    }

    afegirLiniaTauler('✅ Usuaris carregats');
   // window.usuaris = data;
    window.treballadors = data;
    usuaris = data;
    usuaris.forEach((u) => {
      mapaNomIdUsuari[u.nom] = u.id;
    });
    return data;
  } catch (err) {
    console.error("💥 Error inesperat a carregaUsers:", err);
    return [];
  }
}

function refrescarIMostrarModalFitxatgeManual(dataStr) {
  dataActualModal = dataStr; // 📌 guardem per reutilitzar

  // 🧱 Reconstruïm el contingut del modal
  mostrarFitxatgeManual(dataStr); // recorda que no ha de fer `.show()` aquí dins

  // 🪟 Reutilitzem o creem la instància del modal
  const modalEl = document.getElementById("modalFitxatgeManual");
  if (!modalManualInstance) {
    modalManualInstance = new bootstrap.Modal(modalEl);
  }

  // Ens assegurem de no tenir un backdrop persistent abans de mostrar-lo
  setTimeout(() => {
    // 🔍 Netegem possibles fosques antigues
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");

    modalManualInstance.show();
  }, 250); // espera a que el DOM es pinti correctament
}
async function carregaUsersDia(dataStr) {
  try {
    const { data, error } = await supabase
      .from("usuaris")
      .select("*")
      .eq("id_empresa", ID_EMPRESA)
      .eq("data", dataStr); // 🎯 filtre aplicat

    if (error) {
      console.error("❌ Error carregant usuaris:", error);
      return [];
    }

    //console.log('✅ Usuaris carregats:', data);
    usuaris = data;
    //window.treballadors = data;
    return data;
  } catch (err) {
    console.error("💥 Error inesperat a carregaUsers:", err);
    return [];
  }
}

function horaÉsVàlida(horaStr) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(horaStr);
}

async function carregaFitxatges() {
  if (!ID_EMPRESA) return;
  try {
    const { data, error } = await supabase
      .from("fitxatges")
      .select("*")
      .eq("id_empresa", ID_EMPRESA); // 🎯 filtre aplicat

    if (error) {
      console.error("❌ Error carregant fitxatges:", error);
      return [];
    }

    //console.log('📅 Fitxatges carregats:', data);
    window.fitxatges = data;
    fitxatges = data;

    return fitxatges;
  } catch (err) {
    console.error("💥 Error inesperat a carregaFitxatges:", err);
    return [];
  }
}

function obtenirHoraActual() {
  const ara = new Date();
  const hores = ara.getHours().toString().padStart(2, "0");
  const minuts = ara.getMinutes().toString().padStart(2, "0");
  return `${hores}:${minuts}`;
}

async function registrarEntradaDesprésTemporal(nom, dataStr) {
  const hora = new Date().toTimeString().slice(0, 5);
  const id_usuari = mapaNomIdUsuari[nom];
  const fitxatge = {
    nom: nom,
    id_usuari: id_usuari,
    tipus: "entrada",
    tipus_extens: "entrada_després_temporal",
    data: dataStr,
    hora: hora,
    id_empresa: ID_EMPRESA,
  };

  const nou = await insertarFitxatgeRealExtens(fitxatge);
  if (nou) {
    calendar.addEvent({
      id: `fitxatge-${nou.id}`,
      title: `⏳ ${nom} - Sortida Temporal`,
      start: `${dataStr}T${hora}`,
      color: "#ffa726", // Taronja o el que vulguis per diferenciar-la
    });

    mostrar_feedback_info(
      `📤 Sortida temporal enregistrada (${hora})`,
      "valid"
    );
    actualitzarPanell(dataStr);
    reproducirSonido();
  }
  if (nou) {
    mostrar_feedback_info(
      `↩️ Entrada registrada després de sortida temporal (${hora})`,
      "ok"
    );

    actualitzarPanell(dataStr);
  }
}

async function registrarSortidaTemporal(nom, dataStr) {
  const hora = new Date().toTimeString().slice(0, 5);
  const id_usuari = mapaNomIdUsuari[nom];

  const nou = await insertarFitxatgeRealExtens({
    nom,
    id_usuari,
    tipus: "sortida", // segueix sent "sortida" per RLS i informes
    tipus_extens: "sortida_temporal", // afegim context
    data: dataStr,
    hora,
    id_empresa: ID_EMPRESA,
  });

  if (nou) {
    calendar.addEvent({
      id: `fitxatge-${nou.id}`,
      title: `⏳ ${nom} - Sortida Temporal`,
      start: `${dataStr}T${hora}`,
      color: "#ffa726", // Taronja o el que vulguis per diferenciar-la
    });

    mostrar_feedback_info(
      `📤 Sortida temporal enregistrada (${hora})`,
      "valid"
    );
    actualitzarPanell(dataStr);
    reproducirSonido();
  }
}
// Variable global mejorada para temporizadores
const temporizadoresActivos = new Map();

async function actualitzarPanell(dataStr) {

  if (!ID_EMPRESA) return;
  //console.log("DataSTR:", dataStr);
  fitxatges = await carregaFitxatges();
dataImpresio=dataStr;
  const dataActual = new Date().toISOString().slice(0, 10);
  const esDataActual = dataStr === dataActual;
  const dataIso = convertirDataAISOguio(dataStr);

  document.getElementById(
    "panellDeFitxatge"
  ).textContent = `Fitxatges del dia ${dataIso}`;

  const cont = document.getElementById("taulaFitxatges");
  cont.innerHTML = "";

  const fitxatgesDelDia = fitxatges.filter((f) => f.data === dataStr);
  if (esDataActual) fitxatgesDia = [];

  detenerTodosTemporizadores();

  usuaris.forEach((treballador) => {
    const nom = treballador.nom;
    const fitxatgesUsuari = fitxatgesDelDia.filter((f) => f.nom === nom);

    const entrada = fitxatgesUsuari.find(
      (f) => f.tipus === "entrada" && !f.tipus_extens
    );
    const sortidaNormal = fitxatgesUsuari.find(
      (f) => f.tipus === "sortida" && !f.tipus_extens
    );
    const sortidaTemporal = fitxatgesUsuari.find(
      (f) => f.tipus === "sortida" && f.tipus_extens === "sortida_temporal"
    );
    const entradaTemporal = fitxatgesUsuari.find(
      (f) =>
        f.tipus === "entrada" && f.tipus_extens === "entrada_després_temporal"
    );

    const entradaHora = entrada ? entrada.hora.slice(0, 5) : "--:--";
    const sortidaHora = sortidaNormal
      ? sortidaNormal.hora.slice(0, 5)
      : "--:--";

    const entradaDisabled = entradaHora !== "--:--";
    const sortidaDisabled = sortidaHora !== "--:--";
    const potFerSortidaTemporal = entrada && !sortidaNormal && !sortidaTemporal;
    const potFerEntradaTemporal = !!sortidaTemporal && !entradaTemporal;

    if (esDataActual) {
      const id_usuari = mapaNomIdUsuari[nom];
      fitxatgesDia.push({
        nom,
        id_usuari,
        dataStr,
        entrada: entradaDisabled,
        sortida: sortidaDisabled,
      });
    }

    const timerId = `timer-${nom}`;
    let timerHTML = "";
    let debeIniciarTimer = false;

    if (
      esDataActual &&
      entradaHora !== "--:--" &&
      !sortidaNormal &&
      !sortidaTemporal
    ) {
      timerHTML = `<span type="time" class="badge bg-info text-dark" id="${timerId}">00:00</span>`;
      debeIniciarTimer = true;
    } else if (entradaHora !== "--:--" && sortidaHora !== "--:--") {
      timerHTML = `<span class="badge bg-success">${calcularDuracion(
        entradaHora,
        sortidaHora
      )}</span>`;
    }

    // 📦 Contenidor principal
    const div = document.createElement("div");
    div.className = "d-flex flex-column border rounded p-2 mb-2";
    div.classList.add("fondo_div_fitxatge");
    // Capçalera
    const cap = document.createElement("div");
    cap.className = "d-flex justify-content-between align-items-start mb-2";

    const nomDiv = document.createElement("div");

    nomDiv.innerHTML = `<strong>${nom} ${treballador.cognom}</strong>`;

    const timerDiv = document.createElement("div");
    timerDiv.className = "mt-2";
    timerDiv.innerHTML = timerHTML;

    cap.append(nomDiv, timerDiv);

    if (treballador.foto) {
      const foto = document.createElement("div");
      foto.innerHTML = `
        <img src="${treballador.foto}" alt="${nom}"
          class="img-fluid rounded-circle"
          style="width:50px; height:60px; object-fit: cover;">`;
      cap.appendChild(foto);
    }

    div.appendChild(cap);

    // Accions
    const accions = document.createElement("div");
    accions.className = "d-flex align-items-center justify-content-start mb-2";

    const btnEntrada = document.createElement("button");
    btnEntrada.className = "btn btn-sm btn-primary me-1";
    btnEntrada.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Entrada`;
    btnEntrada.disabled = entradaDisabled;
    btnEntrada.addEventListener("click", (e) =>
      fitxar(e, nom, "entrada", dataStr)
    );

    const spanEntrada = crearSpanHora(entradaHora);
    spanEntrada.id = `span-entrada-${nom}`;

    const btnSortida = document.createElement("button");
    btnSortida.className = "btn btn-sm btn-danger me-1";
    btnSortida.innerHTML = `<i class="bi bi-box-arrow-right"></i> Sortida`;
    btnSortida.disabled = sortidaDisabled;
    btnSortida.addEventListener("click", (e) =>
      fitxar(e, nom, "sortida", dataStr)
    );

    const spanSortida = crearSpanHora(sortidaHora);
    spanSortida.id = `span-sortida-${nom}`;

    accions.append(btnEntrada, spanEntrada, btnSortida, spanSortida);

    if (potFerSortidaTemporal) {
      const btnSortidaTemp = document.createElement("button");
      btnSortidaTemp.className = "btn btn-warning btn-sm ms-1";
      btnSortidaTemp.textContent = "⏳ Sortida Temporal";
      btnSortidaTemp.addEventListener("click", () =>
        registrarSortidaTemporal(nom, dataStr)
      );
      accions.appendChild(btnSortidaTemp);
    }

    if (potFerEntradaTemporal) {
      const btnEntradaTemp = document.createElement("button");
      btnEntradaTemp.className = "btn btn-success btn-sm ms-1";
      btnEntradaTemp.textContent = "↩️ Entrada Temporal";
      btnEntradaTemp.addEventListener("click", () =>
        registrarEntradaDesprésTemporal(nom, dataStr)
      );
      accions.appendChild(btnEntradaTemp);
    }

    div.appendChild(accions);
    cont.appendChild(div);

    if (debeIniciarTimer) iniciarTemporizador(nom, entradaHora, timerId);
  });
}

async function insertarFitxatgeRealExtens(fitxatge) {
  if (!horaÉsVàlida(fitxatge.hora)) {
    mostrar_feedback_info("⚠️ Hora no vàlida (format HH:MM)", "error");
    return;
  }
  try {
    const { data: resultat, error } = await supabase
      .from("fitxatges")
      .insert([fitxatge])
      .select(); // ❗ necessari per rebre l’ID generat

    if (error) {
      console.error("❌ Error afegint fitxatge (extens):", error);
      mostrar_feedback_info(
        "❌ No s'ha pogut enregistrar el fitxatge",
        "error"
      );
      return null;
    } else {
      // console.log("✅ Fitxatge extens enregistrat amb èxit:", resultat);
      mostrar_feedback_info("✅ Enregistrant Fitxatge!", "ok");
      const persona = buscarUsuariPerNom(fitxatge.nom);
      simularLecturaTarjeta(persona, fitxatge.tipus);
      numeroDeFitxatges++;
      const avui = new Date().toISOString().split("T")[0];
      actualitzarPanell(avui);
      return resultat[0]; // retornem l'objecte amb l'ID i tot
    }
  } catch (err) {
    console.error("💥 Error inesperat (extens):", err);
    return null;
  }
}

async function insertarFitxatgeReal({
  nom,
  tipus,
  data,
  hora,
  id_empresa = ID_EMPRESA,
}) {
  if (!horaÉsVàlida(hora)) {
    mostrar_feedback_info("⚠️ Hora no vàlida (format HH:MM)", "error");
    return;
  }
  try {
    const id_usuari = mapaNomIdUsuari[nom];

    const { data: resultat, error } = await supabase
      .from("fitxatges")
      .insert([{ id_usuari, nom, tipus, data, hora, id_empresa }])
      .select(); // ❗ necessari per rebre l’ID generat

    if (error) {
      console.error("❌ Error afegint fitxatge:", error);
      mostrar_feedback_info(
        "❌ No s'ha pogut enregistrar el fitxatge",
        "error"
      );
      return null;
    } else {
      // console.log('✅ Fitxatge enregistrat amb èxit:', resultat);
      mostrar_feedback_info("✅ Fitxatge enregistrat!", "ok");
      const persona = buscarUsuariPerNom(nom);
      simularLecturaTarjeta(persona, tipus);
      numeroDeFitxatges++;
      const avui = new Date().toISOString().split("T")[0];
      actualitzarPanell(avui);
      if (mesSeleccionat) {
        mostrarInforme(mesSeleccionat);
      }
      return resultat[0]; // retornem el fitxatge complet (amb ID)
    }
  } catch (err) {
    console.error("💥 Error inesperat:", err);
    return null;
  }
}

async function fitxar(event, nom, tipus, dataStr) {
 // console.log(tipus);
  const hora = new Date().toTimeString().slice(0, 5);
  const diaActual = new Date().toISOString().slice(0, 10);
  if (tipus === "entrada") {
    iniciarTemporizador(nom, hora, `timer-${nom}`);
  } else {
    detenerTemporizador(nom);
  }
  if (dataStr !== diaActual) {
    mostrar_feedback_info(
      `❌ No pots fitxar per a la data ${dataStr}, només es permeten fitxatges per al dia actual.`,
      "error"
    );
    return;
  }
  const id_usuari = mapaNomIdUsuari[nom];

  // 🔄 Enregistrem el fitxatge i esperem l'objecte amb id
  const nouFitxatge = await insertarFitxatgeReal({
    id_usuari,
    nom,
    tipus,
    data: dataStr,
    hora,
    id_empresa: ID_EMPRESA,
  });

  if (nouFitxatge) {
    calendar.addEvent({
      id: `fitxatge-${nouFitxatge.id}`,
      title: `${nom} - ${tipus}`,
      start: `${dataStr}T${hora}`,
      color: tipus === "entrada" ? "#4caf50" : "#f44336",
    });

    document.getElementById(`span-${tipus}-${nom}`).textContent = hora;
    if (event?.target) event.target.disabled = true;

    const persona = buscarUsuariPerNom(nom);
    simularLecturaTarjeta(persona, tipus);
    numeroDeFitxatges++;
    fitxatges=await carregaFitxatges();
    const avui = new Date().toISOString().split("T")[0];
    actualitzarPanell(avui);
    afegirLiniaTauler(`Fixatge enregistrat ${tipus} per ${nom}`);
  }
}

function mostrarFitxatgeManual(dataStr) {
  const cont = document.getElementById("fitxatgeManual");
  cont.innerHTML = "";

  const d = new Date(dataStr);
  const data = d.toISOString().split("T")[0];
  const horaAuto = d.toTimeString().slice(0, 5);
  const horaÉsVàlida = horaAuto !== "00:00";
  const dataIso = convertirDataAISOguio(data);

  const h6 = document.createElement("h6");
  h6.className = "mt-2 mb-3 sticky-top bg-white p-2 border-bottom";
  h6.innerHTML = `🔐 Fitxatge manual per el dia ${dataIso}`;
  cont.appendChild(h6);

  usuaris.forEach((treballador) => {
    const nom = treballador.nom;
    const fitxatgesDia = fitxatges.filter(
      (f) => f.nom === nom && f.data === data
    );

    const entrada = fitxatgesDia.find((f) => f.tipus === "entrada");
    const sortida = fitxatgesDia.find((f) => f.tipus === "sortida");

    const entradaText = entrada ? `🕓 Entrada Modificada: ${entrada.hora}` : "";
    const sortidaText = sortida ? `🕔 Sortida Modificada: ${sortida.hora}` : "";

    const div = document.createElement("div");
    div.className = "border rounded p-2 mb-2 bg-light";

    const htmlBase = `
      <strong>${nom}</strong><br>
      <span class="text-muted small">${entradaText}</span><br>
      <span class="text-muted small">${sortidaText}</span><br>
    `;
    div.innerHTML = htmlBase;
    if (treballador.foto) {
      const foto = document.createElement("img");
      foto.src = treballador.foto;
      foto.alt = nom;
      foto.className = "img-fluid rounded-circle mb-2";
      foto.style.width = "50px";
      foto.style.height = "60px";
      foto.style.objectFit = "cover";

      div.appendChild(foto);
    }

    // 🔢 PIN input
    const pinInput = document.createElement("input");
    pinInput.type = "text";
    pinInput.inputMode = "numeric";
    pinInput.name = "pin-fitxatge";
    pinInput.style.width="auto";
if(adminValidat){
pinInput.placeholder="🔢 Admin Validat";

}else{
      pinInput.placeholder = "🔢 Pin Admin";
}


  
    pinInput.className = "form-control form-control-sm my-1";
    pinInput.id = `pin-${nom}`;
    div.appendChild(pinInput);

    const div2 = document.createElement("div");
    div2.className = "mb-3 row";

    const labelEntrada = document.createElement("label");
    labelEntrada.textContent = "Hora Entrada";
    labelEntrada.className = "col-sm-3 col-form-label";
    div.appendChild(labelEntrada);
    // ⏰ Hora input entrada
    const horaInput = document.createElement("input");
    horaInput.type = "time";
    horaInput.className = "form-control form-control-sm mb-2";

    horaInput.id = `horae-${nom}`;
    horaInput.value = entradaText ? entrada.hora : "08:00";
    div.appendChild(horaInput);

    const labelSortida = document.createElement("label");
    labelSortida.textContent = "Hora Sortida";
    labelSortida.className = "col-sm-3 col-form-label";
    div.appendChild(labelSortida);
    // ⏰ Hora input sortida
    const horaInput2 = document.createElement("input");
    horaInput2.type = "time";
    horaInput2.className = "form-control form-control-sm mb-2";
    horaInput2.id = `horas-${nom}`;
    horaInput2.value = sortidaText ? sortida.hora : "12:00";
    div.appendChild(horaInput2);
    // 🧱 Botons d’acció
    const botons = document.createElement("div");
    botons.className = "d-flex flex-wrap gap-2";

    const btnEntrada = document.createElement("button");
    btnEntrada.className = "btn btn-sm btn-primary";
    btnEntrada.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Entrada Oblidada`;
    btnEntrada.disabled = !!entrada;
    btnEntrada.addEventListener("click", () =>
      fitxarManual(nom, "entrada", data)
    );

    const btnSortida = document.createElement("button");
    btnSortida.className = "btn btn-sm btn-danger";
    btnSortida.innerHTML = `<i class="bi bi-box-arrow-right"></i> Sortida Oblidada`;
    btnSortida.disabled = !!sortida;
    btnSortida.addEventListener("click", () =>
      fitxarManual(nom, "sortida", data)
    );

    botons.append(btnEntrada, btnSortida);
    div.appendChild(botons);

    cont.appendChild(div);
  });

  // 📦 Mostrar modal
  const modal = new bootstrap.Modal(
    document.getElementById("modalFitxatgeManual")
  );
  modal.show();
}

function eliminarManual(nom, tipus, dataStr) {
  const pin = document.getElementById(`pin-${nom}`).value;
  const treballador = usuaris.find((u) => u.nom === nom);
  if (!treballador || treballador.pin !== pin) {
    mostrar_feedback_info("❌ PIN incorrecte!", "error");
    return;
  }
  // Buscar tots els registres i eliminar el que coincideixi amb nom, tipus i data
  const getAllRequest = fitxatges;
  getAllRequest.onsuccess = function (event) {
    const registres = event.target.result;

    registres.forEach((r) => {
      if (r.nom === nom && tipus === "eliminar" && r.data === dataStr) {
        const eventEntrada = calendar.getEventById(`${nom}-entrada-${dataStr}`);
        if (eventEntrada) eventEntrada.remove(); // Elimina l'esdeveniment del calendari
        const eventSortida = calendar.getEventById(`${nom}-sortida-${dataStr}`);
        if (eventSortida) eventSortida.remove(); // Elimina l'esdeven
        //afeixir funcio eliminar fitxatge r(id)

        // store.delete(r.id); // Elimina el registre si ja existia
        mostrar_feedback_info(
          "🚫 Procedeixo a eliminar registres de " + nom + " dia " + dataStr,
          "info"
        );
      }
    });
    // Eliminar tots els esdeveniments del calendari

    actualitzarPanell(dataStr);
  };
}
async function fitxarManual(nom, tipus, dataStr) {
  const pin = document.getElementById(`pin-${nom}`).value;
  //const horaInput = document.getElementById(`hora-${nom}`).value;
  //const hora = redondearCuartoDeHora(tipus, horaInput);
  let hora;
  if (tipus === "entrada") {
    hora = document.getElementById(`horae-${nom}`).value;
  } else {
    hora = document.getElementById(`horas-${nom}`).value;
  }
  // Validació bàsica
  if (!hora) {
    mostrar_feedback_info("⏰ Falta l'hora!", "error");
    return;
  }

  const treballador = usuaris.find((u) => u.rol === "admin");
  if (!adminValidat) {
    if (!treballador || treballador.pin !== pin) {
      mostrar_feedback_info("❌ PIN incorrecte!", "error");
      return;
    }
  }
  const id_usuari = mapaNomIdUsuari[nom];

  // Inserim el fitxatge a Supabase
  const nouFitxatge = await insertarFitxatgeReal({
    id_usuari,
    nom,
    tipus,
    data: dataStr,
    hora: hora,
    id_empresa: ID_EMPRESA,
  });

  if (!nouFitxatge) return;
  if (nouFitxatge) {
    mostrar_feedback_info(`✅ ${tipus} manual enregistrat (${hora})`, "ok");

    // Tanquem el modal si és obert
    const modalEl = document.getElementById("modalFitxatgeManual");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

   
  }
  const emoji = "🛠️";

  calendar.addEvent({
    id: `fitxatge-${nouFitxatge.id}`,
    title: `${emoji}${nom} - ${tipus}`,
    start: `${dataStr}T${hora}`,
    color: tipus === "entrada" ? "#4caf50" : "#f44336",
  });

  mostrar_feedback_info(
    `✔️ Fitxatge manual enregistrat: ${nom} ${tipus} ${hora}`,
    "valid"
  );
  const persona = buscarUsuariPerNom(nom);
  simularLecturaTarjeta(persona, tipus);

  actualitzarPanell(dataStr);
  // 🔁 Tornem a carregar fitxatges i actualitzem el panell de botons
  const { data, error } = await supabase
    .from("fitxatges")
    .select("*")
    .eq("data", dataStr)
    .eq("id_empresa", ID_EMPRESA);

  if (!error) {
    fitxatges = data || [];
    //mostrarFitxatgeManual(dataStr);
  }
}

async function carregarFitxatgesCalendar() {
  if (!ID_EMPRESA) return;
  try {
    calendar.getEvents().forEach((event) => event.remove());

    const { data, error } = await supabase
      .from("fitxatges")
      .select("*")
      .eq("id_empresa", ID_EMPRESA); // 🎯 filtre dinàmic

    if (error) throw error;

    // 🗓️ Pintem cada fitxatge com a esdeveniment
    data.forEach((fitxatge) => {
      calendar.addEvent({
        id: `fitxatge-${fitxatge.id}`,
        title: `${fitxatge.nom} - ${fitxatge.tipus}`,
        start: `${fitxatge.data}T${fitxatge.hora}`,
        color: fitxatge.tipus === "entrada" ? "#4caf50" : "#f44336",
      });
    });

    //console.log(`📌 ${data.length} fitxatges afegits al calendari`);
  } catch (err) {
    console.error("❌ Error carregant fitxatges al calendari:", err);
  }
}

async function afegirModificacioFitxatge(
  fitxatgeOriginal,
  novaHora,
  nouTipus,
  motiu,
  administradorNom
) {
  const modificacio = {
    fitxatge_id: fitxatgeOriginal.id,
    nom: fitxatgeOriginal.nom,
    id_usuari: fitxatgeOriginal.id_usuari || null, // opcional
    nova_data: fitxatgeOriginal.data,
    nou_tipus: nouTipus,
    nova_hora: novaHora,
    motiu,
    modificat_per: administradorNom,
    data_modificacio: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("fitxatges_edits")
      .insert([modificacio]);
    if (error) {
      console.error("❌ Error afegint modificació:", error);
      mostrar_feedback_info(
        "❌ No s'ha pogut enregistrar la modificació",
        "error"
      );
    } else {
      //console.log('📝 Modificació registrada:', modificacio);
      const usu = buscarUsuariPerNom(fitxatgeOriginal.nom);
      simularLecturaTarjeta(usu, nouTipus);
    }
  } catch (err) {
    console.error("💥 Error inesperat registrant modificació:", err);
  }
}
async function mostrarLogModificacions(fitxatge_id) {
  const container = document.getElementById("logModificacions");
  container.innerHTML = "<p class='text-muted'>🔄 Buscant modificacions...</p>";

  try {
    const { data, error } = await supabase
      .from("fitxatges_edits")
      .select("*")
      .eq("fitxatge_id", fitxatge_id)
      .order("data_modificacio", { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML =
        "<p class='text-muted'>🧾 Cap modificació registrada</p>";
      return;
    }

    const llistaHTML = data
      .map(
        (edit) => `
        <div class="border rounded bg-light p-2 mb-2">
          <strong>${edit.nom}</strong> (${edit.nou_tipus} → ${
          edit.nova_hora
        })<br>
          <span class="text-secondary small">${edit.motiu}</span><br>
          <span class="text-info small">✏️ per ${
            edit.modificat_per
          } el ${new Date(edit.data_modificacio).toLocaleString()}</span>
        </div>
      `
      )
      .join("");

    container.innerHTML = `<h6>📋 Modificacions</h6>${llistaHTML}`;
  } catch (err) {
    console.error("❌ Error carregant log de modificacions:", err);
    container.innerHTML =
      "<p class='text-danger'>⚠️ Error carregant modificacions</p>";
  }
}
document.querySelector(".btn-success").addEventListener("click", async () => {
  const idGen = document.getElementById("modalId").value;
  const numero_id = parseInt(idGen.split("-")[1]);
  let nom = document.getElementById("modalUsuari").value;
  nom = nom.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const tipus = document.getElementById("modalAccio").value;
  const dataStr = convertirDataAISO(document.getElementById("modalData").value);
  const motiu = document.getElementById("modalMotiu").value;
  if (!motiu) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = "❌ Falta el motiu de la modificació";
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
    feedback.style.display = "block";
    feedback.style.opacity = "0";

    // Fade-in
    feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });

    // Esborra missatge després d’un temps
    setTimeout(() => {
      feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      setTimeout(() => (feedback.style.display = "none"), 300);
    }, 1800);

    return; // acaba la funcio i atura l'execució
  }
  const modalHoraCompleta = document.getElementById("modalHoraCompleta");
  if (!modalHoraCompleta) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = "❌ Falta introduir la hora actualitzada.";
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
    feedback.style.display = "block";
    feedback.style.opacity = "0";

    // Fade-in
    feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });

    // Esborra missatge després d’un temps
    setTimeout(() => {
      feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      setTimeout(() => (feedback.style.display = "none"), 300);
    }, 1800);

    return; // atura l'execució
  }
  const novaHora = redondearCuartoDeHora(
    tipus,
    document.getElementById("modalHoraCompleta").value
  ); // format 'HH:mm'

  const pass = document.getElementById("modalPassword").value;

  const usuariTrobat = usuaris.find((u) => u.rol === "admin" && u.pin === pass);
  if (!usuariTrobat) {
    const feedback = document.getElementById("feedback");
    feedback.textContent =
      "❌ Contrasenya incorrecta. Aplica Pin Administrador";
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
    feedback.style.display = "block";
    feedback.style.opacity = "0";

    // Fade-in
    feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });

    // Esborra missatge després d’un temps
    setTimeout(() => {
      feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      setTimeout(() => (feedback.style.display = "none"), 300);
    }, 1800);

    return; // atura l'execució
  }

  const registre = fitxatges.find((r) => r.id === numero_id);
  if (!registre) {
    mostrar_feedback_info("❌ Registre no trobat", "error");
    return;
  }

  const admin = usuariTrobat.nom || "Administrador";

  await afegirModificacioFitxatge(registre, novaHora, tipus, motiu, admin);

  const eventActualitzar = calendar.getEventById(`fitxatge-${numero_id}`);
  if (eventActualitzar) {
    eventActualitzar.setStart(`${dataStr}T${novaHora}`);
    eventActualitzar.setProp("title", `🛠️${registre.nom} - ${registre.tipus}`);
  }

  mostrar_feedback_info(
    `✅ Hora modificada: ${nom} ${tipus} ${novaHora}`,
    "valid"
  );
  mostrarFeedbackIAmagarModal("✅ Hora modificada correctament");
  actualitzarPanell(dataStr);
});

async function eliminarFitxatgeComplet(id) {
  if (!id) {
    console.warn("⚠️ No s'ha especificat cap id de fitxatge.");
    return;
  }

  try {
    // 🔴 1. Eliminar els edits associats
    const { error: errorEdits } = await supabase
      .from("fitxatges_edits")
      .delete()
      .eq("fitxatge_id", id);

    if (errorEdits) {
      console.error("❌ Error eliminant fitxatges_edits:", errorEdits.message);
      mostrar_feedback_error("Error en eliminar edits associats.");
      return;
    }

    // 🔵 2. Eliminar el fitxatge principal
    const { error: errorPrincipal } = await supabase
      .from("fitxatges")
      .delete()
      .eq("id", id);

    if (errorPrincipal) {
      console.error("❌ Error eliminant fitxatge:", errorPrincipal.message);
      mostrar_feedback_error("Error en eliminar el fitxatge principal.");
      return;
    }

    // ✅ 3. Feedback OK
    mostrar_feedback_info(`Fitxatge #${id} eliminat completament ✔️`, "ok");
    //refrescarPanellFitxatges(); // si tens funció que recarrega la vista
  } catch (e) {
    console.error("🚨 Error inesperat:", e);
    //mostrar_feedback_error("Error inesperat durant l'eliminació.");
  }
}

document.querySelector(".btn-danger").addEventListener("click", () => {
  let nom = document.getElementById("modalUsuari").value;
  nom = nom.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const idGen = document.getElementById("modalId").value;
  
  //const tipus = document.getElementById("modalAccio").value;
  //const dataStr = convertirDataAISO(document.getElementById("modalData").value);
  const pass = document.getElementById("modalPassword").value;
  const motiu=document.getElementById('modalMotiu').value;
  //const id_usuari = mapaNomIdUsuari[nom];
  //const id_empresa=ID_EMPRESA;
  //corregir

  if (motiu) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = "❌ Falta el motiu per Eliminar";
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
    feedback.style.display = "block";
    feedback.style.opacity = "0";

    // Fade-in
    feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });

    // Esborra missatge després d’un temps
    setTimeout(() => {
      feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      setTimeout(() => (feedback.style.display = "none"), 300);
    }, 1800);

    return; // atura l'execució
  }
  const usuariTrobat = usuaris.find((u) => u.rol === "admin" && u === pass);

  //aqui tambe coorrrrregiiiiiiiiiiiiiiir !

  if (usuariTrobat) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = "❌ Contrasenya incorrecta";
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
    feedback.style.display = "block";
    feedback.style.opacity = "0";

    // Fade-in
    feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      fill: "forwards",
    });

    // Esborra missatge després d’un temps
    setTimeout(() => {
      feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        fill: "forwards",
      });
      setTimeout(() => (feedback.style.display = "none"), 300);
    }, 1800);

    return; // atura l'execució
  }
  //id de fitxatges
  const id = parseInt(idGen.split("-")[1]);
  eliminarFitxatgeComplet(id);
  const event = calendar.getEventById(idGen);
  if (event) {
    event.remove();
  }
  const treballador=buscarUsuariPerNom(nom);
  simularLecturaTarjeta(treballador,"Eliminar");
  mostrar_feedback_info(
    `✅ Registre: ${idGen} Eliminat`,
    "valid",3000
  );
 
  
  document.getElementById("btn-modal-danger").style.display="none";
  
  document.getElementById("btn-modal-success").style.display="none";
  return;
  //aqui cridarem la nova funcio eliminar
});
// 🚀 Inicialització de l’aplicació
function inicialitzarApp(session) {
  afegirLiniaTauler("🔧 Inicialitzant per:"+ session.user.email);
  // accions personalitzades...
}
//console.log("📦 El fitxer main.js s’ha carregat");
async function comprovarSessioInicial() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session || error) {
    console.warn("🔐 No hi ha sessió activa");
    //mostrarPantallaLogin();
  } else {
    console.log("✅ Sessió detectada");
    iniciarSessio();
   
    document.getElementById("card-reader").style.background="#33bb33";
    //inicialitzarApp(session);
  }
}

function gestionarSessioSupabase() {
  supabase.auth.onAuthStateChange((event, session) => {
 
    switch (event) {
      case "SIGNED_IN":
        afegirLiniaTauler("🔓 Sessió iniciada");
         
        inicialitzarApp(session);
        break;

      case "TOKEN_REFRESHED":
        afegirLiniaTauler("🔄 Token renovat en segon pla");
       iniciarCompteEnrereToken(supabase); // 🔁 Reinicia la barra
        inicialitzarApp(session);
         
        break;

      case "SIGNED_OUT":
        afegirLiniaTauler("🔒 Sessió caducada o tancada");
        //mostrarModalSessio(); // modal informatiu
     
     
        document.getElementById("botoSessio").textContent = "Cal reiniciar";
        document.getElementById("botoSessio").disabled = false;
        document.getElementById("card-reader").style.background="#c31a1aff";
        break;

      default:
        afegirLiniaTauler("🔔 Event de sessió:"+ event);
    }
  });

  comprovarSessioInicial(); // primera verificació
}

document.addEventListener("DOMContentLoaded", async () => {
inicialitzarTaulerDebug();

afegirLiniaTauler("✅ Inicialitzant el DOM");
  afegirLiniaTauler("🖥️ Dispositiu: " + detectarDispositiu());
  afegirLiniaTauler("🌐 Navegador: " + detectarNavegador());

  if (comprovarCompatibilitatSupabase()) {
    afegirLiniaTauler("✅ Compatible amb Supabase");
  } else {
    afegirLiniaTauler("❌ No compatible amb Supabase — mode limitat recomanat");
  }
afegirLiniaTauler("🧬 Sistema operatiu: " + detectarSistemaOperatiu());
afegirLiniaTauler("🖐️ Tactil: " + detectarTactil());
afegirLiniaTauler("🖼️ Resolució: " + detectarResolucio());
// Comprovació Service Worker
  afegirLiniaTauler("🛡️ Service Worker:");
  if ("serviceWorker" in navigator) {
    afegirLiniaTauler(" → ✅ Compatible");
    navigator.serviceWorker.getRegistrations().then(regs => {
      if (regs.length === 0) afegirLiniaTauler(" → 🔕 No registrat");
      else afegirLiniaTauler(" → 📦 Registrat: " + regs.map(r => r.scope).join(", "));
    });
  } else {
    afegirLiniaTauler(" → ❌ No compatible");
  }
 const { data, error } = await supabase.from("fitxatges").select().limit(1);

  if (error) {
    afegirLiniaTauler("❌ Error en la consulta:"+ error.message);
  } else {
    afegirLiniaTauler("✅ Connexió Supabase OK");
  }
  // Comprovació JS bàsic
  try {
    afegirLiniaTauler("🧪 Test JS: " + (typeof Promise !== "undefined" ? "✅ Promise disponible" : "❌ No disponible"));
  } catch (err) {
    afegirLiniaTauler("⚠️ Error en test JS");
  }


  // Hora local del TPV
  afegirLiniaTauler("🕒 Hora local: " + new Date().toLocaleString());
  // 🧩 Vincular botó a toggleTauler
  document.getElementById("btnToggleTauler").addEventListener("click", toggleTauler);
  document
    .getElementById("btnActual")
    ?.addEventListener("click", () => mostrarInforme("actual"));
  document
    .getElementById("btnAnterior")
    ?.addEventListener("click", () => mostrarInforme("anterior"));
  document
    .getElementById("btnTancarSessio")
    ?.addEventListener("click", () => tancarSessio());
  const btn = document.getElementById("loginBtn");
  if (btn) {
    //console.log("s'ha trobat el botó loginBtn al DOM");
    btn.addEventListener("click", iniciarSessio);
  } else {
    console.warn("❌ No s'ha trobat el botó loginBtn al DOM");
  }
  
  //supabase.auth.getSession().then(({ data: { session } }) => {
 //  if (session) {
  //    console.log("Estas autenticat");
  
      // Ja està autenticat
 //     document.getElementById("loginScreen").style.visibility = "visible";
      // inicialitzarApp();
 //   } else {
//      console.log("no autenticat");
 //   }
 // });

  const panel = document.getElementById("container-fluid");

  panel.style.visibility = "hidden";
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        afegirLiniaTauler("✔️ Service Worker registrat correctament");
      })
      .catch((error) => {
        afegirLiniaTauler("❌ Error registrant el Service Worker:"+ error);
      });
  }
  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ca",
    height: "auto",
    width: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    views: {
      timeGridWeek: { slotMinTime: "02:00:00", slotMaxTime: "24:00:00" },
      timeGridDay: { slotMinTime: "02:00:00", slotMaxTime: "24:00:00" },
    },
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      //console.log(info);
      const data = info.event.start;
      const hores = String(data.getHours()).padStart(2, "0");
      const minuts = String(data.getMinutes()).padStart(2, "0");
      const dia = String(data.getDate()).padStart(2, "0");
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const any = data.getFullYear();

      const titleParts = info.event.title.split(" - ");
      let nomUsuari = titleParts[0] || "—";
      nomUsuari = nomUsuari.replace(/[^a-zA-ZÀ-ÿ]/g, "");
      const accio = titleParts[1] || "—";
      document.getElementById("modalId").value = info.event.id || "";
      document.getElementById("modalUsuari").value = nomUsuari;
      document.getElementById("modalAccio").value = accio;
      document.getElementById("modalData").value = `${dia}/${mes}/${any}`;
      document.getElementById("modalHoraAnterior").value = `${hores}:${minuts}`;
      document.getElementById("modalHoraCompleta").value = `${hores}:${minuts}`;

      document.getElementById("modalPassword").value = ""; // netegem el camp

      const modal = new bootstrap.Modal(
     

        document.getElementById("detallEvent"),
        {
          backdrop: "static", // ❌ evita el tancament en clicar fora
        }
      );
         document.getElementById("btn-modal-success").style.display="block";
            document.getElementById("btn-modal-danger").style.display="block";
      modal.show();
      const fitxatgeId = parseInt(info.event.id.replace("fitxatge-", ""));
      mostrarLogModificacions(fitxatgeId);

      actualitzarPanell(`${any}-${mes}-${dia}`);
    },
    dateClick: function (info) {
      const avui = new Date().toISOString().split("T")[0];

      document
        .querySelectorAll(".fc-daygrid-day")
        .forEach((cell) => cell.classList.remove("selected"));
      if (info.dayEl && info.dateStr <= avui)
        info.dayEl.classList.add("selected");

      if (info.dateStr > avui) {
        mostrar_feedback_info("🚫 No es pot fitxar en dies futurs", "error");
        document.getElementById("fitxatgeManual").innerHTML = "";
        return;
      }

      if (info.dateStr < avui) {
        dataActualModal = info.dateStr;
        mostrarFitxatgeManual(info.dateStr);
      } else {
        document.getElementById("fitxatgeManual").innerHTML = "";
      }

      actualitzarPanell(info.dateStr);
    },
     
  });
  //await carregaUsers();

  //await carregarFitxatgesCalendar();
  //calendar.render();

  // Mostrem el panell lateral del dia d'avui per defecte
  const avui = new Date().toISOString().split("T")[0];
  actualitzarPanell(avui);

  // Opcional: marquem visualment el dia actual al calendari
  const todayCell = document.querySelector(".fc-daygrid-day.fc-day-today");
  if (todayCell) todayCell.classList.add("selected");

  // Iniciem el rellotge en viu
  actualitzarHora();
  setInterval(actualitzarHora, 1000);
  inicialitzarSelectorsInforme();
  testSupabaseSessio();
  gestionarSessioSupabase();
  esMobil=detectarDispositiuMobil();
  afegirLiniaTauler("Es Mobil : " + esMobil);
  if(esMobil){
document.getElementById("panellEsquerra").style.display="none";
document.getElementById("ver-botones").style.display="none";
document.getElementById("taulerDebug").style.display="none";

  }
});

async function mostrarInformePersonalitzat(mesIndex, any) {
  const primerDia = new Date(any, mesIndex, 1).toISOString().split("T")[0];
  const ultimDia = new Date(any, mesIndex + 1, 0).toISOString().split("T")[0];

  const { data: fitxatges, error } = await supabase
    .from("fitxatges")
    .select("*")
    .gte("data", primerDia)
    .lte("data", ultimDia)
    .eq("id_empresa", ID_EMPRESA);

  if (error) {
    console.error("❌ Error carregant fitxatges:", error);
    return;
  }

  const fitxatgesFiltrats = fitxatges.filter((f) => {
    const dataISO = f.data?.split("T")?.[0]; // Si és cadena
    const [anyData, mesData] = dataISO.split("-").map(Number);

    return anyData === any && mesData === mesIndex + 1;
  });

  construirTaulaAssistencia(fitxatgesFiltrats, "personalitzat", any, mesIndex);
  construirVistaSetmanal(fitxatgesFiltrats, any, mesIndex);
}
function obtenirSetmanesDelMes(any, mes) {
  const setmanes = [];
  let setmanaActual = [];

  const d = new Date(any, mes, 1);

  while (d.getMonth() === mes) {
    const diaSetmana = d.getDay(); // 0 = diumenge
    const data = formatDateLocal(d);

    setmanaActual.push(data);

    if (diaSetmana === 0) {
      setmanes.push(setmanaActual);
      setmanaActual = [];
    }

    d.setDate(d.getDate() + 1);
  }

  if (setmanaActual.length > 0) {
    setmanes.push(setmanaActual);
  }

  return setmanes;
}

function inicialitzarSelectorsInforme() {
  const selectorAny = document.getElementById("selectorAny");
  const selectorMes = document.getElementById("selectorMes");
  const anyActual = new Date().getFullYear();
  const mesActual = new Date().getMonth();
  selectorMes.value = mesActual;
  for (let i = anyActual - 5; i <= anyActual + 1; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    if (i === anyActual) opt.selected = true;
    selectorAny.appendChild(opt);
  }

  document.getElementById("btnMostrarInforme").addEventListener("click", () => {
    const mesIndex = parseInt(document.getElementById("selectorMes").value);
    const any = parseInt(document.getElementById("selectorAny").value);
    mostrarInformePersonalitzat(mesIndex, any);
  });
}
let adminValidat = false;

document
  .getElementById("entrar-administracio")
  .addEventListener("click", () => {
    const panel = document.getElementById("adminPanel");
    const boto = document.getElementById("entrar-administracio");
    const isHidden = window.getComputedStyle(panel).display === "none";

    if (isHidden && !adminValidat) {
      mostrarModalPIN();
      return;
    }
    adminValidat = true;
    panel.style.display = isHidden ? "block" : "none";
    boto.textContent = isHidden
      ? "Tancar Administració"
      : "Veure Administració";
    
    if(boto.textContent==="Veure Administració"){adminValidat=false;}

  });
function mostrarModalPIN() {
  // Elimina si ja existeix
  const antic = document.getElementById("modalPin");
  if (antic) antic.remove();

  const modal = document.createElement("div");
  modal.id = "modalPin";
  modal.innerHTML = `
    <div class="modal-backdrop fade show"></div>
    <div class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); position: fixed; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">🔐 Accés d'administrador</h5>
          </div>
          <div class="modal-body">
            <input type="text" id="inputPin" class="form-control" placeholder="Introdueix el PIN" />
          </div>
          <div class="modal-footer">
            <button id="validarPinBtn" class="btn btn-primary">Validar</button>
            <button id="cancelarPinBtn" class="btn btn-secondary">Cancel·lar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("validarPinBtn")
    .addEventListener("click", async () => {
      const pinInput = document.getElementById("inputPin").value;

      const { data: usuaris, error } = await supabase
        .from("usuaris")
        .select("pin")
        .eq("rol", "admin")
        .eq("id_empresa", ID_EMPRESA)
        .limit(1);

      if (error || !usuaris?.length) {
        alert("❌ No s'ha pogut verificar el PIN");
        return;
      }

      const pinCorrecte = usuaris[0].pin;

      if (pinInput === pinCorrecte) {
        adminValidat = true;
        document.getElementById("modalPin").remove();
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("entrar-administracio").textContent =
          "Tancar Administració";
      } else {
        alert("❌ PIN incorrecte");
      }
    });

  document.getElementById("cancelarPinBtn").addEventListener("click", () => {
    modal.remove();
  });
}

function obtenirDiesLaborablesDelMes(any, mes) {
  const dies = [];
  const d = new Date(any, mes, 1);

  while (d.getMonth() === mes) {
    const diaSetmana = d.getDay();
    if (diaSetmana >= 1 && diaSetmana <= 6) {
      dies.push(formatDateLocal(d)); // 👈 ja no hi ha fus horari erroni
    }
    d.setDate(d.getDate() + 1);
  }

  return dies;
}
function construirVistaSetmanal(fitxatges, any, mesIndex) {
  const cont = document.getElementById("vistaSetmanal");
  cont.innerHTML = "";

  const agrupats = {};
  fitxatges.forEach((f) => {
    if (!agrupats[f.nom]) agrupats[f.nom] = {};
    agrupats[f.nom][f.data] ||= {};
    agrupats[f.nom][f.data][f.tipus] = f.hora;
  });

  const setmanes = obtenirSetmanesDelMes(any, mesIndex);

  Object.keys(agrupats).forEach((nom) => {
    const registre = agrupats[nom];
    const divUsuari = document.createElement("div");
    divUsuari.innerHTML = `<h5 class="mt-3">👤 ${nom}</h5>`;
    cont.appendChild(divUsuari);

    setmanes.forEach((blocDies, idx) => {
      let html = `<div class="mb-2"><strong>🏁 Setmana ${idx + 1} (${
        blocDies[0]
      } a ${
        blocDies[blocDies.length - 1]
      })</strong><table class="table table-sm table-bordered table-striped">
      <thead><tr><th>Dia</th><th>Setmana</th><th>Entrada</th><th>Sortida</th><th>Hores</th><th>Estat</th></tr></thead><tbody>`;

      let totalMinuts = 0;
      let diesComplets = 0;

      blocDies.forEach((data) => {
        const entrada = registre[data]?.entrada || "--:--";
        const sortida = registre[data]?.sortida || "--:--";
        const dateObj = new Date(data);
        const nomDia = [
          "Diumenge",
          "Dilluns",
          "Dimarts",
          "Dimecres",
          "Dijous",
          "Divendres",
          "Dissabte",
        ];
        const diaSetmana = nomDia[dateObj.getDay()];

        let hores = "--:--";
        let estat = "❌ Absent";

        if (entrada !== "--:--" && sortida !== "--:--") {
          const [he, me] = entrada.split(":").map(Number);
          const [hs, ms] = sortida.split(":").map(Number);
          let diff = hs * 60 + ms - (he * 60 + me);
          if (diff < 0) diff += 1440;
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          hores = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          totalMinuts += diff;
          diesComplets++;
          estat = "✅";
        } else if (entrada !== "--:--" || sortida !== "--:--") {
          estat = "⚠️ Incomplet";
        }

        html += `<tr>
          <td>${data}</td>
          <td>${diaSetmana}</td>
          <td>${entrada}</td>
          <td>${sortida}</td>
          <td>${hores}</td>
          <td>${estat}</td>
        </tr>`;
      });

      const hTotals = Math.floor(totalMinuts / 60);
      const mTotals = totalMinuts % 60;

      html += `<tfoot><tr class="table-secondary">
        <td colspan="6"><strong>🧮 Hores totals:</strong> ${String(
          hTotals
        ).padStart(2, "0")}:${String(mTotals).padStart(
        2,
        "0"
      )} | <strong>Dies complets:</strong> ${diesComplets}</td>
      </tr></tfoot></table></div>`;

      const divSetmana = document.createElement("div");
      divSetmana.innerHTML = html;
      cont.appendChild(divSetmana);
    });
  });
}

async function mostrarInforme(mes) {
  const avui = new Date();
  let any = avui.getFullYear();
  let mesIndex = avui.getMonth(); // 0 = gener

  // 🔁 Ajustar si és mes anterior
  if (mes === "anterior") {
    mesIndex -= 1;
    if (mesIndex < 0) {
      mesIndex = 11;
      any -= 1;
    }
  }

  // 🔍 Rang exacte de dates del mes seleccionat
  let mesFinal = mesIndex + 1;
  let anyFinal = any;
  if (mesFinal > 11) {
    mesFinal = 0;
    anyFinal += 1;
  }

  const primerDia = new Date(any, mesIndex, 1).toISOString().split("T")[0];
  const ultimDia = new Date(anyFinal, mesFinal, 0).toISOString().split("T")[0];

  const { data: fitxatgesMes, error } = await supabase
    .from("fitxatges")
    .select("*")
    .gte("data", primerDia)
    .lte("data", ultimDia)
    .eq("id_empresa", ID_EMPRESA);

  if (error) {
    console.error("❌ Error carregant fitxatges del mes:", error);
    return;
  }

  const fitxatgesFiltrats = fitxatges.filter((f) => {
    const dataISO = f.data?.split("T")?.[0]; // Si és cadena
    const [anyData, mesData] = dataISO.split("-").map(Number);

    return anyData === any && mesData === mesIndex + 1;
  });

  construirTaulaAssistencia(fitxatgesFiltrats, mes, any, mesIndex);
}

function formatDateLocal(date) {
  const any = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${any}-${mes}-${dia}`;
}

function construirTaulaAssistencia(fitxatges, etiqueta, any, mesIndex) {
  const cont = document.getElementById("taulaAssistencia");
  cont.innerHTML = `<h6 class="mt-3">📊 Registres de ${
    etiqueta === "actual" ? "mes actual" : "mes anterior"
  }</h6>`;

  const agrupats = {};
  fitxatges.forEach((f) => {
    if (!agrupats[f.nom]) agrupats[f.nom] = {};
    agrupats[f.nom][f.data] ||= {};
    agrupats[f.nom][f.data][f.tipus] = f.hora;
  });
  //const diesTest = obtenirDiesLaborablesDelMes(2025, 6);
  //console.log("Dies laborables juliol 2025:", diesTest);
  // 🔁 Dies laborables del mes rebut
  //console.log("Any:", any);
  //console.log("Mes (0-indexat):", mesIndex); // ha de ser 6 per juliol
  //console.log("Dies laborables:", obtenirDiesLaborablesDelMes(any, mesIndex));

  const diesMes = obtenirDiesLaborablesDelMes(any, mesIndex);

  //console.log(diesMes);
  Object.keys(agrupats).forEach((nom) => {
    const registre = agrupats[nom];
    let html = `<strong>${nom}</strong><div class="table-responsive"><table class="table table-sm table-bordered table-striped">
      <thead>
        <tr>
          <th>Dia</th>
          <th>Setmana</th>
          <th>Entrada</th>
          <th>Sortida</th>
          <th>Hores</th>
          <th></th>
        </tr>
      </thead><tbody>`;

    let totalMinuts = 0;
    let diesTreballats = 0;

    diesMes.forEach((data) => {
      const entrada = registre[data]?.entrada || "--:--";
      const sortida = registre[data]?.sortida || "--:--";

      let hores = "--:--";
      if (entrada !== "--:--" && sortida !== "--:--") {
        const [he, me] = entrada.split(":").map(Number);
        const [hs, ms] = sortida.split(":").map(Number);
        let diff = hs * 60 + ms - (he * 60 + me);
        if (diff < 0) diff += 1440;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        hores = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        totalMinuts += diff;
        diesTreballats++;
      }

      const dateObj = new Date(data);
      const nomDia = [
        "Diumenge",
        "Dilluns",
        "Dimarts",
        "Dimecres",
        "Dijous",
        "Divendres",
        "Dissabte",
      ];
      const diaSetmana = nomDia[dateObj.getDay()];

      let botoOblidat = "";
      if (entrada === "--:--" || sortida === "--:--") {
        botoOblidat = `<button class="btn btn-outline-warning btn-sm btn-insercio-dia" data-dia="${data}" title="Insertar fitxatge oblidat">
          📥
        </button>`;
      }

      html += `<tr>
        <td>${data}</td>
        <td>${diaSetmana}</td>
        <td>${
          entrada !== "--:--"
            ? `<span class="hora-clickable text-primary" data-id="${nom}|${data}|entrada" title="Editar entrada">${entrada}</span>`
            : entrada
        }</td>
        <td>${
          sortida !== "--:--"
            ? `<span class="hora-clickable text-primary" data-id="${nom}|${data}|sortida" title="Editar sortida">${sortida}</span>`
            : sortida
        }</td>
        <td>${hores}</td>
        <td>${botoOblidat}</td>
      </tr>`;
    });

    const hTotals = Math.floor(totalMinuts / 60);
    const mTotals = totalMinuts % 60;

    html += `<tfoot>
      <tr class="table-secondary">
        <td colspan="4"><strong>Total dies treballats:</strong> ${diesTreballats}</td>
        <td><strong>${String(hTotals).padStart(2, "0")}:${String(
      mTotals
    ).padStart(2, "0")}</strong></td>
        <td></td>
      </tr>
    </tfoot></table></div>`;

    const div = document.createElement("div");
    div.innerHTML = html;
    cont.appendChild(div);
  });

  // 🔽 Botons generals
  ["PDF", "Veure PDF", "CSV"].forEach((label, i) => {
    const btn = document.createElement("button");
    btn.className = `btn btn-primary mt-2${i > 0 ? " ms-2" : ""}`;
    btn.textContent = label === "CSV" ? "📂 Exporta a CSV" : `📄 ${label}`;
    btn.onclick = () => {
      if (label === "PDF") exportarInformePDF(fitxatges, etiqueta);
      if (label === "Veure PDF") generarInforme(fitxatges);
      if (label === "CSV") exportarCSV(fitxatges);
    };
    cont.appendChild(btn);
  });

  // 🖱️ Listeners
  setTimeout(() => {
    document.querySelectorAll(".hora-clickable").forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        const [nom, data, tipus] = el.dataset.id.split("|");
        mostrarEdicioFitxatge(nom, data, tipus);
      });
    });

    document.querySelectorAll(".btn-insercio-dia").forEach((btn) => {
      btn.addEventListener("click", () => {
        mostrarFitxatgeManual(btn.dataset.dia);
      });
    });
  }, 50);
}

async function modificarFitxatge(nom, data, tipus, novaHora, pinAdmin) {
  // 🔎 Validar si el PIN correspon a un admin
  const { data: admins, error: errorAdmin } = await supabase
    .from("usuaris")
    .select("id")
    .eq("pin", pinAdmin)
    .eq("rol", "admin")
    .limit(1);
  if (!adminValidat) {
    if (errorAdmin || admins.length === 0) {
      console.warn("❌ PIN incorrecte o usuari no és admin");
      return { ok: false, msg: "PIN incorrecte o no autoritzat" };
    }
  }
  // 🔄 Comprovem si existeix el fitxatge
  const { data: fitxatge, error: errorGet } = await supabase
    .from("fitxatges")
    .select("id")
    .eq("nom", nom)
    .eq("data", data)
    .eq("tipus", tipus)
    .limit(1);

  if (errorGet) {
    console.error("❌ Error buscant fitxatge:", errorGet.message);
    return { ok: false, msg: "Error buscant registre" };
  }

  if (fitxatge.length === 0) {
    // ➕ Si no existeix, afegim el fitxatge nou
    const { error: errorInsert } = await supabase
      .from("fitxatges")
      .insert([{ nom, data, tipus, hora: novaHora }]);

    if (errorInsert) {
      console.error("❌ Error inserint fitxatge:", errorInsert.message);
      return { ok: false, msg: "Error inserint registre" };
    }
  } else {
    // 🖊️ Si existeix, l'actualitzem
    const id = fitxatge[0].id;

    const { error: errorUpdate } = await supabase
      .from("fitxatges")
      .update({ hora: novaHora })
      .eq("id", id);

    if (errorUpdate) {
      console.error("❌ Error actualitzant fitxatge:", errorUpdate.message);
      return { ok: false, msg: "Error actualitzant registre" };
    }
  }

  return { ok: true };
}

function mostrarEdicioFitxatge(nom, data, tipus) {
  const titol = document.getElementById("edicioFitxatgeTitol");
  titol.innerHTML = `✏️ Edició de fitxatge <strong>${tipus}</strong> per <strong>${nom}</strong> — <span class="text-muted">${data}</span>`;

  const inputHora = document.getElementById("edicioFitxatgeHora");
  inputHora.value = ""; // Pots omplir amb hora existent si la trobes

  const inputPin = document.getElementById("edicioFitxatgePin");
  inputPin.value = "";

  const btn = document.getElementById("btnConfirmarEdicio");
  btn.onclick = async () => {
    const novaHora = inputHora.value;
    const pin = inputPin.value;
    if (!adminValidat) {
      if (!novaHora || !pin) {
        alert("⛔ Cal indicar hora i Pin");
        return;
      }
    }
    if (!novaHora) {
      alert("⛔ Cal indicar hora");
      return;
    }
    // 👉 Envia la modificació (exemple genèric)
    const res = await modificarFitxatge(nom, data, tipus, novaHora, pin);
    if (res.ok) {
      bootstrap.Modal.getInstance(
        document.getElementById("modalEdicioFitxatge")
      ).hide();
      actualitzarPanell(data); // O actualitza la taula
      const treballador = buscarUsuariPerNom(nom);
      simularLecturaTarjeta(treballador, tipus);
    } else {
      alert("❌ Error modificant fitxatge");
    }
  };

  new bootstrap.Modal(document.getElementById("modalEdicioFitxatge")).show();
}

function obtenirTitolPDF(etiqueta) {
  const ara = new Date();
  const ref = new Date(
    ara.getFullYear(),
    ara.getMonth() + (etiqueta === "anterior" ? -1 : 0),
    1
  );
  return ref.toLocaleString("ca-ES", { month: "long", year: "numeric" });
}

function exportarInformePDF(fitxatges, etiqueta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = afegirCapcalera(doc, empresa);

  const agrupats = {};
  fitxatges.forEach((f) => {
    agrupats[f.nom] = agrupats[f.nom] || {};
    agrupats[f.nom][f.data] = agrupats[f.nom][f.data] || {};
    agrupats[f.nom][f.data][f.tipus] = f.hora;
  });

  Object.keys(agrupats).forEach((nom) => {
    const resultat = usuaris.find((u) => u.nom === nom);
    //if (y > 230) {

    y = afegirCapcalera(doc, empresa);
    //}

    const yStart = y;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Treballador: ${resultat.nom} ${resultat.cognom}`, 12, y + 6);

    y += 6;

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("Data ", 14, y);
    doc.text("Entrada", 44, y);
    doc.text("Sortida", 64, y);
    doc.text("Hores", 84, y);
    y += 6;

    let total = 0,
      dies = 0;
    Object.keys(agrupats[nom]).forEach((data) => {
      const entrada = agrupats[nom][data].entrada || "--:--";
      const sortida = agrupats[nom][data].sortida || "--:--";
      let hores = "--:--";
      if (entrada !== "--:--" && sortida !== "--:--") {
        const [he, me] = entrada.split(":").map(Number);
        const [hs, ms] = sortida.split(":").map(Number);
        let mins = hs * 60 + ms - (he * 60 + me);
        if (mins < 0) mins += 1440;
        hores = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
          mins % 60
        ).padStart(2, "0")}`;
        total += mins;
        dies++;
      }
      doc.setFont("helvetica", "normal");
      doc.text(data, 14, y);
      doc.text(entrada, 44, y);
      doc.text(sortida, 64, y);
      doc.text(hores, 84, y);

      y += 5;
      if (y > 270) {
        doc.addPage();
        y = afegirCapcalera(doc, empresa);
      }
    });

    const h = Math.floor(total / 60);
    const m = total % 60;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total dies: ${dies} · Total hores: ${String(h).padStart(
        2,
        "0"
      )}:${String(m).padStart(2, "0")}`,
      14,
      y
    );
    y += 8;

    // Bloc final amb data i signatura
    const dataInforme = new Date().toLocaleDateString("ca-ES");
    const ciutat = empresa.ciutat;
    doc.setFont("helvetica", "normal");
    doc.text(`Data de l'informe: ${dataInforme}`, 14, y);
    y += 6;
    doc.text(`Lloc: ${ciutat}`, 14, y);
    y += 12;
    doc.text("Signatura del responsable:", 14, y);
    doc.text("El Treballador", 74, y);
    y += 5;
    // Requadres per signatura
    doc.rect(14, y, 50, 12); // Amplada 50, Altura 25
    doc.rect(74, y, 50, 12); // Amplada 50, Altura 25

    y += 15;

    // Requadre per tota la secció
    doc.rect(10, yStart, 190, y - yStart);
    y += 10;
    doc.addPage();
  });
  doc.save(`fitxatges_${etiqueta}.pdf`);
}

function exportarCSV(fitxatges) {
 // console.log(fitxatges);
  if (!fitxatges || fitxatges.length === 0) {
    mostrar_feedback_info("No hi ha dades per exportar.", "info");
    return;
  }

  // Agrupar els registres per data
  const grupsPerData = {};

  fitxatges.forEach(({ data, hora, nom, tipus }) => {
    if (!grupsPerData[data]) {
      grupsPerData[data] = { data, usuaris: {} };
    }

    if (!grupsPerData[data].usuaris[nom]) {
      grupsPerData[data].usuaris[nom] = {
        entradaHora: "",
        sortidaHora: "",
        hores: 0,
      };
    }

    if (tipus === "entrada") {
      grupsPerData[data].usuaris[nom].entradaHora = hora;
    } else if (tipus === "sortida") {
      grupsPerData[data].usuaris[nom].sortidaHora = hora;

      // Calcular hores treballades (simplificat)
      const [hEntrada, mEntrada] = grupsPerData[data].usuaris[nom].entradaHora
        .split(":")
        .map(Number);
      const [hSortida, mSortida] = hora.split(":").map(Number);

      const totalMinuts = hSortida * 60 + mSortida - (hEntrada * 60 + mEntrada);
      grupsPerData[data].usuaris[nom].hores = (totalMinuts / 60).toFixed(2);
    }
  });

  // Convertir a CSV
  let csv = "Data,Nom,Hora Entrada,Hora Sortida,Hores\n";
  let fecha;
  Object.values(grupsPerData).forEach(({ data, usuaris }) => {
    Object.entries(usuaris).forEach(
      ([nom, { entradaHora, sortidaHora, hores }]) => {
        csv += `${data},${nom},${entradaHora},${sortidaHora},${hores}\n`;
        fecha = data;
      }
    );
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fitxatges-" + fecha + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
function afegirCapcalera(doc, empresa) {
  let y = 10;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Empresa", 40, y + 7);
  doc.text("C.I.F", 40, y + 13);
  doc.text("Adresa", 40, y + 19);
  doc.text("Ciutat", 40, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.rect(10, y, 190, 26);
  doc.text(empresa.nom, 50, y + 7);
  doc.setFontSize(10);
  doc.text(empresa.cif, 50, y + 13);
  doc.text(empresa.direccio, 50, y + 19);
  doc.text(empresa.ciutat, 50, y + 25);
  if (empresa.logo) doc.addImage(empresa.logo, "JPEG", 8, y + 8, 30, 16);
  y += 34;
  doc.setFontSize(16);
  doc.text(`Informe de fitxatges`, 10, y);
  return y + 12;
}

function generarInforme(fitxatges) {
  fitxatges.sort((b, a) => new Date(b.data) - new Date(a.data));
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = afegirCapcalera(doc, empresa);

  const agrupats = {};
  fitxatges.forEach((f) => {
    agrupats[f.nom] = agrupats[f.nom] || {};
    agrupats[f.nom][f.data] = agrupats[f.nom][f.data] || {};
    agrupats[f.nom][f.data][f.tipus] = f.hora;
  });

  Object.keys(agrupats).forEach((nom) => {
    const resultat = usuaris.find((u) => u.nom === nom);
    //if (y > 230) {

    y = afegirCapcalera(doc, empresa);
    //}

    const yStart = y;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Treballador: ${resultat.nom} ${resultat.cognom}`, 12, y + 6);

    y += 6;

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("Data ", 14, y);
    doc.text("Entrada", 44, y);
    doc.text("Sortida", 64, y);
    doc.text("Hores", 84, y);
    y += 6;

    let total = 0,
      dies = 0;
    Object.keys(agrupats[nom]).forEach((data) => {
      const entrada = agrupats[nom][data].entrada || "--:--";
      const sortida = agrupats[nom][data].sortida || "--:--";
      let hores = "--:--";
      if (entrada !== "--:--" && sortida !== "--:--") {
        const [he, me] = entrada.split(":").map(Number);
        const [hs, ms] = sortida.split(":").map(Number);
        let mins = hs * 60 + ms - (he * 60 + me);
        if (mins < 0) mins += 1440;
        hores = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
          mins % 60
        ).padStart(2, "0")}`;
        total += mins;
        dies++;
      }
      doc.setFont("helvetica", "normal");
      doc.text(data, 14, y);
      doc.text(entrada, 44, y);
      doc.text(sortida, 64, y);
      doc.text(hores, 84, y);

      y += 5;
      if (y > 270) {
        doc.addPage();
        y = afegirCapcalera(doc, empresa);
      }
    });

    const h = Math.floor(total / 60);
    const m = total % 60;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total dies: ${dies} · Total hores: ${String(h).padStart(
        2,
        "0"
      )}:${String(m).padStart(2, "0")}`,
      14,
      y
    );
    y += 8;

    // Bloc final amb data i signatura
    const dataInforme = new Date().toLocaleDateString("ca-ES");
    const ciutat = empresa.ciutat;
    doc.setFont("helvetica", "normal");
    doc.text(`Data de l'informe: ${dataInforme}`, 14, y);
    y += 6;
    doc.text(`Lloc: ${ciutat}`, 14, y);
    y += 12;
    doc.text("Signatura del responsable:", 14, y);
    doc.text("El Treballador", 74, y);
    y += 5;
    // Requadres per signatura
    doc.rect(14, y, 50, 12); // Amplada 50, Altura 25
    doc.rect(74, y, 50, 12); // Amplada 50, Altura 25

    y += 15;

    // Requadre per tota la secció
    doc.rect(10, yStart, 190, y - yStart);
    y += 10;
    doc.addPage();
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  document.getElementById("visorPDF").src = url;

  // Mostrar botons
  const link = document.getElementById("descarregarPDF");
  link.href = url;
  link.download = "informe_fitxatges.pdf";
  link.style.display = "inline";

  const imprimir = document.getElementById("imprimirPDF");
  imprimir.style.display = "inline";
  imprimir.onclick = () => {
    const frame = document.getElementById("visorPDF");
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };
}
document
  .getElementById("activar-conexion")
  .addEventListener("click", async () => {
    const panel = document.getElementById("container-fluid");
    const emailInput = document.getElementById("emailInput").value;
    const valor=await carregaEmpresa(emailInput);
    if(!valor)await tancarSessio();

    panel.style.visibility = "visible";
    document.getElementById("empresa_operativa").textContent = empresa.nom;
    await carregaUsers();
    await carregaFitxatges();
    await carregarFitxatgesCalendar();

    calendar.render();

    const avui = new Date().toISOString().split("T")[0];
    actualitzarPanell(avui);
    // Actualizar el reloj cada segundo
    setInterval(updateClock, 1000);
    updateClock(); // Mostrar hora inmediatamente
    //actualitzarHora();
    setInterval(actualitzarHora, 1000);

    document.getElementById("container-fluid").style.display = "block";
    document.getElementById("activar-conexion").style.display = "none";
    document.getElementById("ver-botones").style.display = "block";
    document.getElementById("entrar-administracio").style.display = "block";
    document.getElementById("activar-sonido").style.display = "block";
    reproducirSonidoValor("whatsapp-apple.mp3");

  
  });


async function iniciarSessio() {
 // console.log("🔐 Funció iniciarSessio comensada");
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  const errorMsg = document.getElementById("errorLogin");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorMsg.textContent = "❌ Credencials incorrectes";
    errorMsg.style.display = "block";
  } else {
    // Accés concedit!
    afegirLiniaTauler("🔐 Funció iniciarSessio comensada");
    document.getElementById("loginScreen").style.visibility = "hidden";
    const sessio = await supabase.auth.getSession();
    const email = sessio.data.session?.user.email || "—";
    iniciarCompteEnrereToken(supabase);
   console.log(sessio);
   // console.log(email);
    document.getElementById(
      "usuariActiu"
    ).innerHTML = `👤 <strong>${email}</strong>`;
   segonsRestants=3600;

   iniciarContadorSessio();
   
    document.getElementById("activar-conexion").click();
    playSound();
  testSupabaseSessio();
  }
}
async function tancarSessio() {
  await supabase.auth.signOut();
  location.reload(); // Torna a mostrar el formulari de login
}
function importarFitxatgesDesDeCSV(textCSV) {
  const files = textCSV.trim().split("\n");
  const encapçalat = files.shift(); // Elimina la primera línia (capçaleres)
  const fitxatgesAInsertar = [];

  files.forEach((linia) => {
    const [data, nom, horaEntrada, horaSortida] = linia
      .split(",")
      .map((c) => c.trim());
    const id_usuari = mapaNomIdUsuari[nom];

    if (!id_usuari) {
      console.warn(`⚠️ No trobat id_usuari per: ${nom}`);
      return;
    }

    // Fitxatge entrada
    fitxatgesAInsertar.push({
      nom,
      id_usuari,
      id_empresa: ID_EMPRESA,
      data,
      hora: horaEntrada,
      tipus: "entrada",
    });

    // Fitxatge sortida
    fitxatgesAInsertar.push({
      nom,
      id_usuari,
      id_empresa: ID_EMPRESA,
      data,
      hora: horaSortida,
      tipus: "sortida",
    });
  });

  // Ara inserir-los tots (exemple amb supabase client)
  fitxatgesAInsertar.forEach(async (fitxatge) => {
    const { error } = await supabase.from("fitxatges").insert(fitxatge);
    if (error) {
      console.error("❌ Error a insertar:", fitxatge, error.message);
    } else {
     // console.log("✅ Inserit:", fitxatge);
    }
  });
}
document.getElementById("csvInput").addEventListener("change", function () {
  const fitxer = this.files[0];
  if (!fitxer) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const contingutCSV = e.target.result;
    importarFitxatgesDesDeCSV(contingutCSV); // 👈 Aquesta és la funció que vam preparar abans
  };
  reader.readAsText(fitxer);
});

function convertirDataAISOguio(dataInput) {
  const [dia, mes, any] = dataInput.split("-");
  return `${any}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}
function convertirDataAISO(dataInput) {
  const [dia, mes, any] = dataInput.split("/");
  return `${any}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

//document.getElementById("adminPanel").style.display = "none";
function reproducirSonido() {
  document.getElementById("miSonido").src =
    "./sounds/trabar-carro-alarma-auto-.mp3";
  const audio = document.getElementById("miSonido");

  audio.play();
}
function reproducirSonidoValor(valor) {
  document.getElementById("miSonido").src = "./sounds/" + valor;
  const audio = document.getElementById("miSonido");

  audio.play();
}
async function playSound() {
  //console.log("Reproduint so : reminder.mp3");
  let audio = new Audio("./sounds/whatsapp-apple.mp3"); // Substitueix amb la teva ruta del fitxer d'àudio

  audio.play();
}
function simularLecturaTarjeta(treballador, tipus) {
  if (!treballador) return;
  const cardReader = document.getElementById("card-reader");
  const card = document.getElementById("card");
  document.getElementById("nomCard").textContent =
    treballador.nom + " " + treballador.cognom;
  document.getElementById("tipusCard").textContent = "Targeta " + tipus;
  document.getElementById("fotoCard").src = treballador.foto;

  card.style.animation = "none";

  card.offsetHeight; // Trigger reflow
  // Activar animaciones sincronizadas
  card.style.animation = "swipe 5.2s ease-in-out";
  //handIcon.style.animation = 'swipe-hand 5.2s ease-in-out';
  // Mostrar elementos

  card.style.transform = "scale(1)"; // Resetear escala
  //icon.style.transform='scale(1)';
  card.classList.remove("chip-verde");
  cardReader.querySelector(".reader-light").style.animation = "none";
  card.offsetHeight; // Trigger reflow

  // Nueva animación con scale y opacity
  card.style.animation = "swipe 5.2s ease-in-out";
  cardReader.querySelector(".reader-light").style.animation = "blink 5s";
  // Mostrar lector
  cardReader.style.display = "block";
  // Animación JS para el efecto 3D (control preciso)
  const keyframes = [
    { transform: "scale(1.7)", opacity: 1 }, // Inicio (normal)
    { transform: "scale(1.2)", opacity: 0.9 },
    { transform: "scale(1)", opacity: 0.8 }, // Alejamiento (a los 1s)
    { transform: "scale(1)", opacity: 0.8 }, // Alejamiento (a los 1s)
    { transform: "scale(1.2)", opacity: 0.9 }, // Acercamiento (a los 3s)
    { transform: "scale(1.7)", opacity: 1 }, // Final (normal)
  ];

  const timing = {
    duration: 5500, // 4 segundos
    iterations: 1,
  };

  card.animate(keyframes, timing);
  //handIcon.animate(keyframes, timing);
  // Chip verde a los 3.5s (antes de cerrar)

  setTimeout(() => {
    card.classList.add("chip-verde");
  }, 2500);
  // Destello a los 2600ms (mitad de 5200ms)
  setTimeout(efectoDestello, 2600);
  setTimeout(() => {
    cardReader.style.display = "block";
  }, 5500);
}
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  document.getElementById(
    "clock"
  ).textContent = `${hours}:${minutes}:${seconds}`;
}
function contarTreballadors(usuaris) {
  return usuaris.filter(u => u.rol === "treballador").length;
}
  
async function actualitzarHora() {
  const ara = new Date();
  const dies = [
    "Diumenge",
    "Dilluns",
    "Dimarts",
    "Dimecres",
    "Dijous",
    "Divendres",
    "Dissabte",
  ];
  const mesos = [
    "de Gener",
    "de Febrer",
    "de Març",
    "d’Abril",
    "de Maig",
    "de Juny",
    "de Juliol",
    "d’Agost",
    "de Setembre",
    "d’Octubre",
    "de Novembre",
    "de Desembre",
  ];

  // Comprovar l'hora cada minut
  const dia_fitxar = `${dies[ara.getDay()]} ${ara.getDate()} ${
    mesos[ara.getMonth()]
  } ${ara.getFullYear()}`;

  document.getElementById("reader-avui").textContent = dia_fitxar;
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  //recorrer el array fitxatgesDia i comprobar si hi ha algun fitxatge de entrada o sortida

  // Configura l'hora en què vols reproduir el so (exemple: 15:30)
   const nf=contarTreballadors(usuaris);
  // console.log(nf);
  //recorrer el array fitxatgesDia i comprobar si entrada=true
  const entradaFitxatges = fitxatgesDia.filter((f) => f.entrada === true);
  const sortidaFitxatges = fitxatgesDia.filter((f) => f.sortida === true);
const minutsValids = [45,50,55,56,57,58,59];
const segonsValids = [0, 30];
if(entradaFitxatges.length<nf){
  document.getElementById("icona-reloj-entrada").style.display="block";

}else{
  document.getElementById("icona-reloj-entrada").style.display="none";

}
if(sortidaFitxatges.length<nf){
  document.getElementById("icona-reloj-sortida").style.display="block";

}else{
  document.getElementById("icona-reloj-sortida").style.display="none";

}

  if (
    entradaFitxatges.length < nf &&
    hours === 7 &&
    minutsValids.includes(minutes) && 
    segonsValids.includes(seconds)
  ) {
      //console.log(entradaFitxatges);
  
    const texto="🔔 Hora de Fitxar Entrada ! 🔔 Alarma Conectada Falten "+(nf-entradaFitxatges.length)+ " Fitxatges Entrada";
    mostrar_feedback_info(texto,"alarma",6000)
  }

      if (entradaFitxatges.length ===nf &&
    hours === 7 &&
    minutsValids.includes(minutes) && 
    segonsValids.includes(seconds)) {
   
 mostrar_feedback_info(
          "🔔 Ja heu fitxat entrada, no cal que ho feu de nou! Alarma Desconectada",
          "ok",
          6000
        );
       
      } 
    
  
  if (
    sortidaFitxatges.length < nf &&
    hours === 12 &&
    (minutes === 0 || minutes === 5 || minutes === 10||minutes===15) &&
    (seconds === 0 || seconds === 30)
  ) {
   
     
        
        mostrar_feedback_info(
          "🔔 Hora de Fitxar Sortida ! 🔔 Alarma Conectada",
          "alarma",
          6000
        );
      }
      
      
      if(sortidaFitxatges.length>=nf   &&
    hours === 12 &&
    (minutes === 0 || minutes === 5 || minutes === 10) &&
    (seconds === 0 || seconds === 15 || seconds === 30 || seconds === 45)){
     
        mostrar_feedback_info(
          "🔔 Tots els fitxatges del dia realizats! Alarma Desconectada",
          "ok",
          6000
        );
      }
      actualitzarNumeroCercle(entradaFitxatges.length,sortidaFitxatges.length);
  }

// Función mejorada para iniciar temporizadores
function iniciarTemporizador(nom, horaInicio, timerId) {
  // Detener temporizador existente si lo hay
  if (temporizadoresActivos.has(nom)) {
    clearInterval(temporizadoresActivos.get(nom));
  }

  const [hora, minuto] = horaInicio.split(":").map(Number);
  const inicio = new Date();
  inicio.setHours(hora, minuto, 0, 0);

  const actualizarTemporizador = () => {
    const ahora = new Date();
    const diff = ahora - inicio;

    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    const tiempoFormateado =
      `${String(horas).padStart(2, "0")}:` +
      `${String(minutos).padStart(2, "0")}:` +
      `${String(segundos).padStart(2, "0")}`;

    const elemento = document.getElementById(timerId);
    if (elemento) {
      elemento.textContent = tiempoFormateado;
    } else {
      clearInterval(temporizadoresActivos.get(nom));
    }
  };

  // Actualizar inmediatamente y luego cada segundo
  actualizarTemporizador();
  const intervalo = setInterval(actualizarTemporizador, 1000);
  temporizadoresActivos.set(nom, intervalo);
}

// Función para detener todos los temporizadores
function detenerTodosTemporizadores() {
  temporizadoresActivos.forEach((intervalo, nom) => {
    clearInterval(intervalo);
    temporizadoresActivos.delete(nom);
  });
}

// Función para detener un temporizador específico
function detenerTemporizador(nom) {
  if (temporizadoresActivos.has(nom)) {
    clearInterval(temporizadoresActivos.get(nom));
    temporizadoresActivos.delete(nom);
  }
}

// Función de cálculo de duración (optimizada)
function calcularDuracion(horaInicio, horaFinal) {
  const [h1, m1] = horaInicio.split(":").map(Number);
  const [h2, m2] = horaFinal.split(":").map(Number);

  const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(minsRestantes).padStart(
    2,
    "0"
  )}`;
}
// Función para el destello
function efectoDestello() {
  const cardReader = document.getElementById("card-reader");
  cardReader.style.background = "white";
  document.body.style.background = "black";
  //document.getElementById('calendar').style.visibility="hidden";
  cardReader.style.boxShadow = "0 0 30px white";
  setTimeout(() => {
    cardReader.style.background = " #33bb33";
    document.body.style.background = " #dde0e7";
    document.getElementById("calendar").style.visibility = "visible";
  }, 300);
  reproducirSonido();
}

function buscarUsuariPerNom(nom) {
  const treballador = usuaris.find((u) => u.nom === nom);
  if (treballador) {
    return treballador;
  } else {
    mostrar_feedback_info("❌ No s´ha trobat treballador per nom!", "error");
    return false;
  }
}

function mostrar_feedback_info(text, tipus = "info", durada = 3000) {
  const feedback = document.getElementById("feedback-info");
  if (!feedback) return;

  // Neteja classes anteriors
  feedback.className = "fw-semibold text-center mb-2";

  // Assigna classes segons el tipus
  switch (tipus) {
    case "error":
      feedback.classList.add("text-danger");
      feedback.style.color = "white";
      feedback.style.fontSize="24px";
      reproducirSonidoValor("fallo-1.mp3");
      break;

    case "ok":
      feedback.classList.add("text-success");
      feedback.style.color = "white";
      break;
    case "alarma":
      feedback.classList.add("text-info");
      feedback.style.color = "white";
      reproducirSonidoValor("perro.mp3");
      break;
    case "success":
      feedback.classList.add("text-success");
      feedback.style.color = "white";
      reproducirSonidoValor("trabar-carro-alarma-auto-.mp3");
      break;
    case "warning":
      feedback.classList.add("text-warning");
      reproducirSonidoValor("fallo-1.mp3");
      break;
    default:
      feedback.classList.add("text-info");
      reproducirSonido();
  }

  // Mostra el missatge
  feedback.textContent = text;
  feedback.style.display = "block";
  feedback.style.opacity = "0";

  // Animació d’aparició
  feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 200,
    fill: "forwards",
  });

  // Amagar després de X segons
  setTimeout(() => {
    feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      fill: "forwards",
    });
    setTimeout(() => {
      feedback.style.display = "none";
    }, 300);
  }, durada);
}

function mostrarFeedbackIAmagarModal(missatge) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = missatge;
  feedback.style.display = "block";
  feedback.style.opacity = "0";

  // Fade-in suau
  feedback.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
    fill: "forwards",
  });

  setTimeout(() => {
    // Fade-out
    feedback.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 300,
      fill: "forwards",
    });

    // Tancar modal després del delay
    setTimeout(() => {
      const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("detallEvent")
      );
      modal.hide();
      feedback.style.display = "none";
    }, 400);
  }, 1200);
}

function redondearCuartoDeHora(tipo, horaStr) {
  // Convertir la hora en string a minutos totales
  const [horas, minutos] = horaStr.split(":").map(Number);
  let minutosTotales = horas * 60 + minutos;

  // Lógica de redondeo
  const residuo = minutosTotales % 15;
  let minutosRedondeados;

  if (tipo === "entrada") {
    // Redondear hacia arriba al próximo cuarto
    minutosRedondeados =
      residuo === 0 ? minutosTotales : minutosTotales + (15 - residuo);
  } else if (tipo === "sortida") {
    // Redondear hacia abajo al cuarto anterior
    minutosRedondeados = minutosTotales - residuo;
  } else {
    throw new Error('Tipo no válido. Usar "entrada" o "sortida"');
  }

  // Convertir de vuelta a formato HH:MM
  const horasRedondeadas = Math.floor(minutosRedondeados / 60) % 24;
  const minutosFinales = minutosRedondeados % 60;

  return `${String(horasRedondeadas).padStart(2, "0")}:${String(
    minutosFinales
  ).padStart(2, "0")}`;
}

// ⏳ Actualitzar el text del botó cada segon
function actualitzarTextBoto() {
  const min = String(Math.floor(segonsRestants / 60)).padStart(2, "0");
  const sec = String(segonsRestants % 60).padStart(2, "0");
  document.getElementById("botoSessio").textContent = `La Sessió expira en ${min}:${sec}`;
}
// 🕒 Iniciar el comptador
function iniciarContadorSessio() {
  actualitzarTextBoto();

  intervalSessio = setInterval(() => {
    segonsRestants--;
if(segonsRestants===0)afegirLiniaTauler("Sessió caducada: Cal tornar enviar les credencials");
    if (segonsRestants <= 0) {
      document.getElementById("loginScreen").style.visibility="visible";

      document.getElementById("container-fluid").style.visibility="hidden";
      clearInterval(intervalSessio);
      mostrarModalSessio();
      const boto = document.getElementById("botoSessio");
      boto.textContent = "Cal reiniciar";
      boto.disabled = false;
    } else {
      actualitzarTextBoto();
    }
  }, 1000);
}

// 🔔 Mostrar el modal de Inici de sessio
function mostrarModalSessio() {
  const modal = document.getElementById("modalSessio");
  modal.style.display = "block";
}


// ✅ Recomanat
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();

  e.returnValue = ""; // Encara cal per mostrar el diàleg en alguns navegadors
});