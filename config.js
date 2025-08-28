// CONFIGURAÇÃO DO DASHBOARD
const DASHBOARD_CONFIG = {
    // ID da planilha do Google Sheets
    SHEET_ID: '1p7RJr9mecGTC2bvRnnd4rN2bUCjXlZGQ9p8c4dC3W3M',
    
    // Configurações da empresa
    EMPRESA: {
        nome: 'LD CELULOSE',
        subtitulo: 'Levantamento Físico de Ativos Imobilizados',
        responsavel: 'Suzanne Silva',
        totalAtivos: 1168
    },
    
    // Configurações dos técnicos
    TECNICOS: {
        OSCAR: {
            nome: 'Oscar Silva',
            cargo: 'Técnico Especialista',
            avatar: 'OS',
            cor: '#22c55e'
        },
        JESSICA: {
            nome: 'Jessica Santos',
            cargo: 'Técnica Especialista',
            avatar: 'JS',
            cor: '#0e7490'
        }
    },
    
    // Metas e configurações de progresso
    METAS: {
        porDia: 60,
        totalMensal: 584
    },
    
    // URLs das imagens
    IMAGENS: {
        logoEmpresa: 'assets/images/LOGO.png',
        logoSaraf: 'assets/images/SARAF.png'
    },
    
    // Configurações de atualização
    REFRESH: {
        autoRefresh: true,
        intervaloMinutos: 5
    },
    
    // Configurações do calendário
    CALENDARIO: {
        ano: 2025,
        mes: 7, // Agosto (0-based: Janeiro = 0)
        nomeMes: 'Agosto 2025'
    },
    
    // Cores do tema
    CORES: {
        primaria: '#0e7490',
        secundaria: '#22c55e',
        erro: '#e53e3e',
        neutro: '#718096',
        fundo: '#fafbfc'
    }
};

// Função para obter a URL do CSV
function getSheetCSVUrl() {
    return `https://docs.google.com/spreadsheets/d/${DASHBOARD_CONFIG.SHEET_ID}/export?format=csv&gid=0`;
}

// Função para obter configurações de um técnico
function getTecnicoConfig(nome) {
    return DASHBOARD_CONFIG.TECNICOS[nome.toUpperCase()];
}

// Validação da configuração
function validarConfig() {
    const erros = [];
    
    if (!DASHBOARD_CONFIG.SHEET_ID) {
        erros.push('ID da planilha não configurado');
    }
    
    if (!DASHBOARD_CONFIG.EMPRESA.totalAtivos || DASHBOARD_CONFIG.EMPRESA.totalAtivos <= 0) {
        erros.push('Total de ativos deve ser maior que zero');
    }
    
    if (Object.keys(DASHBOARD_CONFIG.TECNICOS).length === 0) {
        erros.push('Nenhum técnico configurado');
    }
    
    if (erros.length > 0) {
        console.warn('Problemas na configuração:', erros);
        return false;
    }
    
    return true;
}

// Exporta as configurações
window.DASHBOARD_CONFIG = DASHBOARD_CONFIG;
window.getSheetCSVUrl = getSheetCSVUrl;
window.getTecnicoConfig = getTecnicoConfig;
window.validarConfig = validarConfig;
