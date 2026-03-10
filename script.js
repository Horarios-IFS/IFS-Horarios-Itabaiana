// ==========================================================
// CONFIGURAÇÃO
// ==========================================================
// A URL continua a mesma do site principal
const URL_DA_API = "https://script.google.com/macros/s/AKfycbytgWLx_X4LDUWZLja55a8lz2oTsoVZZqOKlH95PvYPkp98akl7s-NrNlxuQykYpFQS/exec"; 

// Estrutura de Horários Fixa
const HORARIOS = [
    { label: "07:30 - 08:20", id: "07:30" },
    { label: "08:20 - 09:10", id: "08:20" },
    { label: "09:10 - 10:00", id: "09:10" },
    { label: "10:10 - 11:00", id: "10:10" },
    { label: "11:00 - 11:50", id: "11:00" },
    { label: "ALMOÇO", id: " almoco", type: "break" },
    { label: "13:00 - 13:50", id: "13:00" },
    { label: "13:50 - 14:40", id: "13:50" },
    { label: "14:40 - 15:30", id: "14:40" },
    { label: "15:40 - 16:30", id: "15:40" },
    { label: "16:30 - 17:20", id: "16:30" },
    { label: "17:20 - 18:10", id: "17:20" },
    { label: "JANTAR", id: "jantar", type: "break" },
    { label: "18:50 - 19:40", id: "18:50" },
    { label: "19:40 - 20:30", id: "19:40" },
    { label: "20:40 - 21:30", id: "20:40" },
    { label: "21:30 - 22:20", id: "21:30" }
];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

// Estado da Aplicação (Simplificado)
let dadosGlobais = [];
let salaAtual = null;

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    carregarTema();
    inicializarApp();
    
    // Listeners (Apenas Tema)
    document.getElementById("themeToggle").addEventListener("click", alternarTema);
});

async function inicializarApp() {
    mostrarLoading(true);
    
    try {
        // Cache para carregamento rápido
        const cache = localStorage.getItem("ifs_horarios_cache");
        if (cache) {
            dadosGlobais = JSON.parse(cache);
        }

        // Busca dados novos
        await atualizarDados();

        // Roteamento via URL (permite mandar link direto da sala)
        const params = new URLSearchParams(window.location.search);
        const salaParam = params.get("sala");

        if (salaParam) {
            abrirSala(decodeURIComponent(salaParam));
        } else {
            renderizarHome();
        }

    } catch (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao conectar com o servidor. Verifique sua internet.");
    } finally {
        mostrarLoading(false);
    }
}

async function atualizarDados() {
    try {
        const response = await fetch(URL_DA_API);
        const json = await response.json();
        
        if (json.status === "success") {
            dadosGlobais = json.data;
            localStorage.setItem("ifs_horarios_cache", JSON.stringify(dadosGlobais));
        }
    } catch (e) {
        console.warn("Falha ao buscar dados frescos, usando cache se existir.");
    }
}

// ==========================================================
// RENDERIZAÇÃO
// ==========================================================

function renderizarHome() {
    document.getElementById("view-home").classList.remove("hidden");
    document.getElementById("view-grade").classList.add("hidden");
    history.pushState(null, "", window.location.pathname); 

    const container = document.getElementById("lista-salas");
    container.innerHTML = "";

    // Extrair salas únicas
    const salas = [...new Set(dadosGlobais.map(item => item.Sala))].sort();

    if (salas.length === 0) {
        document.getElementById("msg-vazio").classList.remove("hidden");
        return;
    }

    salas.forEach(sala => {
        const btn = document.createElement("div");
        btn.className = "bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-ifs-green flex flex-col items-center justify-center text-center group";
        btn.onclick = () => abrirSala(sala);
        btn.innerHTML = `
            <i class="fa-solid fa-chalkboard-user text-3xl mb-3 text-gray-400 group-hover:text-ifs-green transition"></i>
            <h3 class="font-bold text-lg dark:text-white">${sala}</h3>
            <p class="text-xs text-gray-500 mt-1">Ver horários</p>
        `;
        container.appendChild(btn);
    });
}

function abrirSala(sala) {
    salaAtual = sala;
    document.getElementById("view-home").classList.add("hidden");
    document.getElementById("view-grade").classList.remove("hidden");
    document.getElementById("titulo-sala").innerText = sala;
    
    // Atualiza URL
    const novaURL = `${window.location.pathname}?sala=${encodeURIComponent(sala)}`;
    history.pushState(null, "", novaURL);

    const tbody = document.getElementById("corpo-tabela");
    tbody.innerHTML = "";

    HORARIOS.forEach(horarioObj => {
        const tr = document.createElement("tr");
        
        // Intervalos (Almoço/Jantar)
        if (horarioObj.type === "break") {
            tr.className = "bg-gray-100 dark:bg-gray-700";
            tr.innerHTML = `<td colspan="7" class="px-4 py-2 text-center font-bold text-xs uppercase text-gray-500 dark:text-gray-300 tracking-wider">${horarioObj.label}</td>`;
            tbody.appendChild(tr);
            return;
        }

        tr.className = "border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition";
        
        // Coluna Horário
        const tdHorario = document.createElement("td");
        tdHorario.className = "px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-gray-800";
        tdHorario.innerText = horarioObj.label;
        tr.appendChild(tdHorario);

        // Colunas Dias
        DIAS.forEach(dia => {
            const td = document.createElement("td");
            td.className = "px-4 py-3 border-l border-gray-100 dark:border-gray-700 min-h-[60px]";
            
            // Buscar dados
            const aula = dadosGlobais.find(d => 
                d.Sala === salaAtual && 
                d.Dia === dia && 
                d.Horario_Inicio === horarioObj.id
            );

            if (aula) {
                td.innerHTML = `
                    <div class="flex flex-col gap-1">
                        <span class="font-bold text-ifs-green text-sm leading-tight">${aula.Disciplina}</span>
                        <span class="text-xs text-gray-600 dark:text-gray-300"><i class="fa-solid fa-user-tie mr-1"></i>${aula.Professor}</span>
                        <span class="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-1 rounded w-fit">${aula.Turma}</span>
                    </div>
                `;
            } else {
                td.innerHTML = `<span class="text-gray-300 text-xs select-none">-</span>`;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function voltarHome() {
    renderizarHome();
}

// ==========================================================
// UTILITÁRIOS
// ==========================================================

function mostrarLoading(show) {
    const el = document.getElementById("loading");
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
}

function alternarTema() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        html.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
}

function carregarTema() {
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
    }

}
