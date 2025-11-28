/**
 * GATB - Gestão de Antimicrobianos
 * Arquivo JavaScript principal
 *
 * Sistema de gestão de tratamentos com antimicrobianos
 * para ambiente hospitalar (UTI/enfermarias)
 */

// ========================================
// ESTADO DO SISTEMA
// ========================================
let currentTab = 'active'; // 'active' (em curso) ou 'history' (histórico)
let patients = [];         // Lista de pacientes em tratamento ativo
let history = [];          // Lista de pacientes que receberam alta

// ========================================
// INICIALIZAÇÃO E LOCALSTORAGE
// ========================================

/**
 * Carrega dados salvos no LocalStorage do navegador
 * Se não houver dados, cria paciente de exemplo
 */
function loadData() {
    const storedPatients = localStorage.getItem('antibio_patients');
    const storedHistory = localStorage.getItem('antibio_history');

    if (storedPatients) patients = JSON.parse(storedPatients);
    if (storedHistory) history = JSON.parse(storedHistory);

    // Dados de exemplo se estiver tudo vazio (primeiro uso)
    if (!storedPatients && !storedHistory) {
        patients = [
            {
                id: 1,
                name: "Exemplo Silva",
                location: "UTI-01",
                drug: "Meropenem",
                start: new Date().toISOString().split('T')[0],
                duration: 7
            }
        ];
    }
}

/**
 * Salva dados no LocalStorage do navegador
 * Chamado após qualquer alteração nos dados
 */
function saveData() {
    localStorage.setItem('antibio_patients', JSON.stringify(patients));
    localStorage.setItem('antibio_history', JSON.stringify(history));
}

// ========================================
// LÓGICA PRINCIPAL
// ========================================

/**
 * Calcula informações de status do tratamento
 * @param {Object} p - Objeto do paciente
 * @returns {Object} Status com dias, texto, cor, porcentagem, etc.
 */
function getStatusInfo(p) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(p.start + 'T00:00:00');

    // Calcula diferença em dias
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let text = `D${diffDays} / D${p.duration}`;
    let color = 'var(--success)';
    let rawStatus = 'Em curso';

    // Define cor e status baseado no progresso
    if (diffDays > p.duration) {
        color = 'var(--danger)';
        text = `VENCIDO (+${diffDays - p.duration})`;
        rawStatus = 'Vencido';
    } else if (diffDays >= p.duration - 1) {
        color = 'var(--warning)';
        rawStatus = 'Reavaliar';
    }

    const percent = Math.min((diffDays / p.duration) * 100, 100);
    return { diffDays, text, color, percent, rawStatus, startDate };
}

/**
 * Troca entre abas (Em Curso / Histórico)
 * @param {string} tab - 'active' ou 'history'
 */
function switchTab(tab) {
    currentTab = tab;

    // Atualiza estado visual dos botões de aba
    document.getElementById('tabActive').className = tab === 'active' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabHistory').className = tab === 'history' ? 'tab-btn active' : 'tab-btn';

    // Esconde/Mostra painel de adicionar paciente
    const addPanel = document.getElementById('addPanel');
    if (tab === 'active') {
        addPanel.classList.remove('hidden');
    } else {
        addPanel.classList.add('hidden');
    }

    render();
}

/**
 * Renderiza os cards na tela baseado na aba atual e filtro de busca
 */
function render() {
    const grid = document.getElementById('cardGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = '';

    // Decide qual lista usar baseado na aba atual
    let sourceArray = currentTab === 'active' ? patients : history;

    // Aplica filtro de busca
    const filtered = sourceArray.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.drug.toLowerCase().includes(searchTerm) ||
        p.location.toLowerCase().includes(searchTerm)
    );

    // Exibe mensagem se não houver resultados
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results">Nenhum registro encontrado em "${currentTab === 'active' ? 'Em Curso' : 'Histórico'}".</div>`;
        return;
    }

    // Ordenação: Mais antigos primeiro na ativa, Mais recentes primeiro no histórico
    if (currentTab === 'active') {
        filtered.sort((a, b) => a.start.localeCompare(b.start));
    } else {
        filtered.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    }

    // Gera HTML para cada paciente
    filtered.forEach(p => {
        let cardHTML = '';

        if (currentTab === 'active') {
            // --- RENDER CARD ATIVO ---
            const status = getStatusInfo(p);
            cardHTML = `
                <div class="card" style="border-left-color: ${status.color}">
                    <div class="card-header">
                        <span class="patient-name">${p.name}</span>
                        <span class="location">${p.location}</span>
                    </div>
                    <div class="antibiotic-info">
                        <div class="drug-name">${p.drug}</div>
                        <div class="dates">Início: ${formatDateBR(p.start)}</div>
                    </div>
                    <div class="day-counter" style="color: ${status.color}">${status.text}</div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${status.percent}%; background-color: ${status.color}"></div>
                    </div>
                    <div class="actions">
                        <button class="btn-sm btn-move" onclick="moveBed(${p.id})">📍 Leito</button>
                        <button class="btn-sm btn-renew" onclick="renew(${p.id})">🔄 +Dias</button>
                        <button class="btn-sm btn-discharge" onclick="discharge(${p.id})">✅ Alta</button>
                    </div>
                </div>`;
        } else {
            // --- RENDER CARD HISTÓRICO ---
            cardHTML = `
                <div class="card history-card">
                    <div class="card-header">
                        <span class="patient-name">${p.name}</span>
                        <span class="location" style="background:#ddd;">${p.location}</span>
                    </div>
                    <div class="antibiotic-info">
                        <div class="drug-name">${p.drug}</div>
                        <div class="dates">
                            Início: ${formatDateBR(p.start)}<br>
                            <strong>Finalizado em: ${formatDateBR(p.endDate)}</strong>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="btn-sm btn-restore" onclick="restore(${p.id})">↩ Restaurar</button>
                        <button class="btn-sm btn-delete" onclick="deletePermanent(${p.id})">🗑 Excluir</button>
                    </div>
                </div>`;
        }
        grid.innerHTML += cardHTML;
    });
}

// ========================================
// AÇÕES DO USUÁRIO
// ========================================

/**
 * Adiciona novo paciente ao sistema
 * Valida campos e salva no LocalStorage
 */
function addCard() {
    const name = document.getElementById('pName').value;
    const loc = document.getElementById('pLoc').value;
    const drug = document.getElementById('pDrug').value;
    const start = document.getElementById('pStart').value;
    const dur = parseInt(document.getElementById('pDuration').value);

    // Validação de campos
    if (name && loc && drug && start && dur) {
        patients.push({
            id: Date.now(),
            name,
            location: loc,
            drug,
            start,
            duration: dur
        });
        saveData();
        render();

        // Limpa campos do formulário
        document.getElementById('pName').value = '';
        document.getElementById('pLoc').value = '';
        document.getElementById('pDrug').value = '';
        document.getElementById('pStart').value = '';
        document.getElementById('pDuration').value = '';
    } else {
        alert("Preencha todos os campos");
    }
}

/**
 * Dá alta ao paciente (move para histórico)
 * @param {number} id - ID do paciente
 */
function discharge(id) {
    const idx = patients.findIndex(x => x.id === id);
    if (idx > -1) {
        if (confirm("Confirmar alta/fim do tratamento? O paciente irá para o Histórico.")) {
            const p = patients[idx];
            p.endDate = new Date().toISOString().split('T')[0]; // Salva data de hoje
            history.push(p); // Move para histórico
            patients.splice(idx, 1); // Remove da lista ativa
            saveData();
            render();
        }
    }
}

/**
 * Restaura paciente do histórico para lista ativa
 * @param {number} id - ID do paciente
 */
function restore(id) {
    const idx = history.findIndex(x => x.id === id);
    if (idx > -1) {
        const p = history[idx];
        delete p.endDate; // Remove data de fim
        patients.push(p); // Volta para lista ativa
        history.splice(idx, 1); // Remove do histórico
        saveData();
        switchTab('active'); // Leva usuário para aba ativa
    }
}

/**
 * Deleta permanentemente registro do histórico
 * @param {number} id - ID do paciente
 */
function deletePermanent(id) {
    if (confirm("Tem certeza? Isso apagará o registro para sempre.")) {
        history = history.filter(x => x.id !== id);
        saveData();
        render();
    }
}

/**
 * Move paciente para outro leito
 * @param {number} id - ID do paciente
 */
function moveBed(id) {
    const p = patients.find(x => x.id === id);
    const newLoc = prompt(`Novo leito para ${p.name}:`, p.location);
    if (newLoc) {
        p.location = newLoc;
        saveData();
        render();
    }
}

/**
 * Renova/estende duração do tratamento
 * @param {number} id - ID do paciente
 */
function renew(id) {
    const p = patients.find(x => x.id === id);
    const moreDays = prompt(`Adicionar quantos dias?`, "3");
    if (moreDays) {
        p.duration += parseInt(moreDays);
        saveData();
        render();
    }
}

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Formata data YYYY-MM-DD para DD/MM
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada DD/MM
 */
function formatDateBR(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
}

/**
 * Exporta lista atual para PDF
 * Usa biblioteca jsPDF para gerar documento
 */
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const title = currentTab === 'active'
        ? "Relatório: Em Curso (Ativos)"
        : "Relatório: Histórico de Altas";
    const sourceArray = currentTab === 'active' ? patients : history;

    // Cabeçalho do PDF
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    // Prepara dados para tabela
    const tableData = sourceArray.map(p => {
        if (currentTab === 'active') {
            const s = getStatusInfo(p);
            return [p.name, p.location, p.drug, formatDateBR(p.start), s.text, s.rawStatus];
        } else {
            return [p.name, p.location, p.drug, formatDateBR(p.start), formatDateBR(p.endDate), "Concluído"];
        }
    });

    // Define cabeçalhos da tabela
    const headers = currentTab === 'active'
        ? [['Paciente', 'Local', 'ATB', 'Início', 'Progresso', 'Status']]
        : [['Paciente', 'Local', 'ATB', 'Início', 'Fim', 'Status']];

    // Gera tabela no PDF
    doc.autoTable({
        head: headers,
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: {
            fillColor: currentTab === 'active' ? [0, 123, 255] : [108, 117, 125]
        }
    });

    // Baixa o arquivo
    doc.save(`antibioticos_${currentTab}.pdf`);
}

// ========================================
// INICIALIZAÇÃO
// ========================================
loadData();
render();
