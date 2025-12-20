/**
 * GATB - Gestão de Antimicrobianos
 * Arquivo JavaScript principal (Refatorado para API)
 *
 * Sistema de gestão de tratamentos com antimicrobianos
 * Integração: SharePoint Lists via Power Automate
 */

// ========================================
// ESTADO DO SISTEMA
// ========================================
let currentTab = 'active'; // 'active' ou 'history'
let patients = [];         // Lista de pacientes em tratamento ativo
let history = [];          // Lista de pacientes que receberam alta

// ========================================
// CAMADA DE SERVIÇO (API)
// ========================================

const api = {
    /**
     * Busca todos os dados da API
     */
    async getAll() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/patients`);
            if (!res.ok) throw new Error('Erro na requisição');
            return await res.json(); // Retorna { patients: [], history: [] }
        } catch (error) {
            console.error("Erro API:", error);
            alert("Erro ao conectar com servidor.");
            return { patients: [], history: [] };
        }
    },

    /**
     * Cria um novo registro
     */
    async create(patient) {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patient)
            });
            return res.ok;
        } catch (error) {
            console.error("Erro ao criar:", error);
            return false;
        }
    },

    /**
     * Atualiza um registro existente
     */
    async update(id, updates) {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/patients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return res.ok;
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            return false;
        }
    },

    /**
     * Move para histórico (alta) ou restaura
     */
    async move(patient, targetList) {
        // Define o novo status baseado na lista de destino
        const status = targetList === 'history' ? 'history' : 'active';
        // Chama o update passando o status atualizado e quaisquer outras propriedades alteradas (já presentes em patient)
        return this.update(patient.id, { ...patient, status });
    },

    /**
     * Deleta um registro
     */
    async delete(id) {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/patients/${id}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (error) {
            console.error("Erro ao deletar:", error);
            return false;
        }
    }
};

// ========================================
// CONTROLE DE INTERFACE (LOADING)
// ========================================

function setLoading(isLoading) {
    const overlay = document.getElementById('loadingOverlay');
    if (isLoading) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}

// ========================================
// INICIALIZAÇÃO
// ========================================

async function loadData() {
    setLoading(true);

    // Buscar dados da API
    const data = await api.getAll();

    // Se a API retornar formato { patients: [], history: [] }
    if (data.patients) patients = data.patients;
    if (data.history) history = data.history;

    // Se estiver vazio e for modo mock, manter vazio ou lógica anterior
    // (Código antigo de exemplo removido para focar na API)

    setLoading(false);
    render();
}

/**
 * Função Wrapper para recarregar tudo após uma ação
 */
async function reload() {
    await loadData();
    render(); // Redundante pois loadData chama render, mas garante
}

// ========================================
// LÓGICA PRINCIPAL (Mantida similar, mas chamando API)
// ========================================

function getStatusInfo(p) {
    // Mesma lógica anterior
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(p.start + 'T00:00:00');

    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let text = `D${diffDays} / D${p.duration}`;
    let color = 'var(--success)';
    let rawStatus = 'Em curso';

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

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tabActive').className = tab === 'active' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabHistory').className = tab === 'history' ? 'tab-btn active' : 'tab-btn';

    const addPanel = document.getElementById('addPanel');
    if (tab === 'active') addPanel.classList.remove('hidden');
    else addPanel.classList.add('hidden');

    render();
}

function render() {
    const grid = document.getElementById('cardGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = '';

    let sourceArray = currentTab === 'active' ? patients : history;

    const filtered = sourceArray.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.drug.toLowerCase().includes(searchTerm) ||
        p.location.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results">Nenhum registro encontrado em "${currentTab === 'active' ? 'Em Curso' : 'Histórico'}".</div>`;
        return;
    }

    if (currentTab === 'active') {
        filtered.sort((a, b) => a.start.localeCompare(b.start));
    } else {
        filtered.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    }

    filtered.forEach(p => {
        let cardHTML = '';
        if (currentTab === 'active') {
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
                        <button class="btn-sm btn-move" onclick="moveBed('${p.id}')">📍 Leito</button>
                        <button class="btn-sm btn-renew" onclick="renew('${p.id}')">🔄 +Dias</button>
                        <button class="btn-sm btn-discharge" onclick="discharge('${p.id}')">✅ Alta</button>
                    </div>
                </div>`;
        } else {
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
                        <button class="btn-sm btn-restore" onclick="restore('${p.id}')">↩ Restaurar</button>
                        <button class="btn-sm btn-delete" onclick="deletePermanent('${p.id}')">🗑 Excluir</button>
                    </div>
                </div>`;
        }
        grid.innerHTML += cardHTML;
    });
}

// ========================================
// AÇÕES DO USUÁRIO (Async)
// ========================================

async function addCard() {
    const name = document.getElementById('pName').value;
    const loc = document.getElementById('pLoc').value;
    const drug = document.getElementById('pDrug').value;
    const start = document.getElementById('pStart').value;
    const dur = parseInt(document.getElementById('pDuration').value);

    if (name && loc && drug && start && dur) {
        setLoading(true);

        const newPatient = {
            id: Date.now(), // ID temporário, idealmente o SharePoint retorna o ID real
            name, location: loc, drug, start, duration: dur
        };

        // Salvar na API
        await api.create(newPatient);

        // Limpar campos
        document.getElementById('pName').value = '';
        document.getElementById('pLoc').value = '';
        document.getElementById('pDrug').value = '';
        document.getElementById('pStart').value = '';
        document.getElementById('pDuration').value = '';

        // Recarregar
        await reload();
    } else {
        alert("Preencha todos os campos");
    }
}

async function discharge(id) {
    const p = patients.find(x => x.id === id);
    if (!p) return;

    if (confirm("Confirmar alta/fim do tratamento?")) {
        setLoading(true);
        p.endDate = new Date().toISOString().split('T')[0];

        // Enviar atualização de status/lista
        // Aqui assumimos que a API sabe mover baseada no payload ou action
        await api.move(p, 'history');

        await reload();
    }
}

async function restore(id) {
    const p = history.find(x => x.id === id);
    if (!p) return;

    setLoading(true);
    delete p.endDate;

    await api.move(p, 'patients'); // Mover de volta para lista ativa

    await reload();
    switchTab('active');
}

async function deletePermanent(id) {
    if (confirm("Tem certeza? Isso apagará o registro para sempre.")) {
        setLoading(true);
        await api.delete(id);
        await reload();
    }
}

async function moveBed(id) {
    const p = patients.find(x => x.id === id);
    const newLoc = prompt(`Novo leito para ${p.name}:`, p.location);
    if (newLoc) {
        setLoading(true);
        await api.update(id, { location: newLoc });
        await reload();
    }
}

async function renew(id) {
    const p = patients.find(x => x.id === id);
    const moreDays = prompt(`Adicionar quantos dias?`, "3");
    if (moreDays) {
        setLoading(true);
        const newDuration = p.duration + parseInt(moreDays);
        await api.update(id, { duration: newDuration });
        await reload();
    }
}

// ========================================
// UTILITÁRIOS
// ========================================

function formatDateBR(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
}

function exportPDF() {
    // ... Mantido igual ...
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = currentTab === 'active' ? "Relatório: Em Curso (Ativos)" : "Relatório: Histórico de Altas";
    const sourceArray = currentTab === 'active' ? patients : history;

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    const tableData = sourceArray.map(p => {
        if (currentTab === 'active') {
            const s = getStatusInfo(p);
            return [p.name, p.location, p.drug, formatDateBR(p.start), s.text, s.rawStatus];
        } else {
            return [p.name, p.location, p.drug, formatDateBR(p.start), formatDateBR(p.endDate), "Concluído"];
        }
    });

    const headers = currentTab === 'active'
        ? [['Paciente', 'Local', 'ATB', 'Início', 'Progresso', 'Status']]
        : [['Paciente', 'Local', 'ATB', 'Início', 'Fim', 'Status']];

    doc.autoTable({
        head: headers,
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: currentTab === 'active' ? [0, 123, 255] : [108, 117, 125] }
    });

    doc.save(`antibioticos_${currentTab}.pdf`);
}

// ========================================
// START
// ========================================
loadData();
