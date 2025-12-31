/**
 * MOCK DATA - Apenas para testes locais
 * Remove este arquivo em produção!
 */

// Sobrescrever a função api.getAll para retornar dados mock
const originalGetAll = api.getAll;

api.getAll = async function() {
    console.log('🧪 MODO TESTE: Usando dados mock');

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    // Dados de exemplo
    return {
        patients: [
            {
                id: 'mock_001',
                name: 'João Silva',
                location: 'UTI-01',
                drug: 'Amoxicilina',
                start: '2025-12-20',
                duration: 7,
                status: 'active',
                messages: [
                    {
                        id: 'msg_001',
                        author: 'Dr. Carlos Mendes',
                        role: 'Médico(a)',
                        content: 'Paciente respondeu bem ao tratamento inicial. Manter dose atual.',
                        timestamp: '2025-12-30T10:30:00Z',
                        type: 'observation',
                        edited: false
                    },
                    {
                        id: 'msg_002',
                        author: 'Enfª Ana Paula',
                        role: 'Enfermeiro(a)',
                        content: 'Administrado às 14:00. Sem reações adversas observadas.',
                        timestamp: '2025-12-30T14:05:00Z',
                        type: 'observation',
                        edited: false
                    }
                ]
            },
            {
                id: 'mock_002',
                name: 'Maria Santos',
                location: 'UTI-02',
                drug: 'Ceftriaxona',
                start: '2025-12-25',
                duration: 10,
                status: 'active',
                messages: []
            },
            {
                id: 'mock_003',
                name: 'Pedro Oliveira',
                location: 'Leito 104',
                drug: 'Vancomicina',
                start: '2025-12-22',
                duration: 14,
                status: 'active',
                messages: [
                    {
                        id: 'msg_101',
                        author: 'Dr. Roberto Lima',
                        role: 'Médico(a)',
                        content: 'Paciente apresentou febre leve (37.8°C). Avaliar necessidade de ajuste de dose?',
                        timestamp: '2025-12-31T08:20:00Z',
                        type: 'question',
                        edited: false
                    },
                    {
                        id: 'msg_102',
                        author: 'Farm. Juliana Costa',
                        role: 'Farmacêutico(a)',
                        content: 'ATENÇÃO: Nível sérico da droga próximo ao limite superior. Solicitar novo exame laboratorial.',
                        timestamp: '2025-12-31T09:15:00Z',
                        type: 'alert',
                        edited: false
                    }
                ]
            }
        ],
        history: [
            {
                id: 'mock_h001',
                name: 'Ana Rodrigues',
                location: 'Leito 203',
                drug: 'Ciprofloxacino',
                start: '2025-12-10',
                duration: 7,
                endDate: '2025-12-17',
                status: 'history',
                messages: [
                    {
                        id: 'msg_201',
                        author: 'Dr. Fernando Silva',
                        role: 'Médico(a)',
                        content: 'Tratamento concluído com sucesso. Paciente recebeu alta hospitalar.',
                        timestamp: '2025-12-17T10:00:00Z',
                        type: 'observation',
                        edited: false
                    }
                ]
            }
        ]
    };
};

// Sobrescrever api.update para simular salvamento
api.update = async function(id, updates) {
    console.log('🧪 MOCK: Simulando salvamento', { id, updates });

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simular sucesso
    return true;
};

console.log('✅ Mock data carregado! Dados de teste disponíveis.');
console.log('⚠️  ATENÇÃO: Este é um modo de teste. Dados não são salvos permanentemente.');
