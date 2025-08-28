// CONFIGURAÇÃO DA PLANILHA
const SHEET_ID = '1p7RJr9mecGTC2bvRnnd4rN2bUCjXlZGQ9p8c4dC3W3M';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

// VARIÁVEIS GLOBAIS
let dashboardData = {
    tecnicos: {},
    totalAtivos: 1168,
    diasTrabalhados: 0,
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
};

// FUNÇÃO PRINCIPAL PARA CARREGAR DADOS
async function carregarDadosPlanilha() {
    try {
        console.log('Carregando dados da planilha...');
        
        // Tentativa de acesso direto
        const response = await fetch(SHEET_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV carregado com sucesso');
        
        // Processa os dados CSV
        processarDadosCSV(csvText);
        
    } catch (error) {
        console.error('Erro ao carregar dados da planilha:', error);
        console.log('Tentando método alternativo...');
        
        // Método alternativo usando proxy CORS
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(SHEET_CSV_URL)}`;
            const proxyResponse = await fetch(proxyUrl);
            const proxyData = await proxyResponse.json();
            
            if (proxyData.contents) {
                console.log('Dados carregados via proxy');
                processarDadosCSV(proxyData.contents);
                return;
            }
        } catch (proxyError) {
            console.error('Erro no método alternativo:', proxyError);
        }
        
        // Fallback com dados estáticos
        console.log('Usando dados estáticos como fallback...');
        usarDadosEstaticos();
    }
}

// PROCESSAR DADOS CSV
function processarDadosCSV(csvText) {
    try {
        const linhas = csvText.split('\n').filter(linha => linha.trim() !== '');
        console.log(`Processando ${linhas.length} linhas de dados`);
        
        // Busca pela seção dos técnicos (linha que contém "DATA")
        let indiceDados = -1;
        for (let i = 0; i < linhas.length; i++) {
            if (linhas[i].toLowerCase().includes('data') && linhas[i].toLowerCase().includes('oscar')) {
                indiceDados = i;
                break;
            }
        }
        
        if (indiceDados === -1) {
            // Busca alternativa
            for (let i = 0; i < linhas.length; i++) {
                if (linhas[i].includes('04/08/2025') || linhas[i].includes('2025')) {
                    indiceDados = i;
                    break;
                }
            }
        }
        
        if (indiceDados === -1) {
            throw new Error('Não foi possível localizar os dados dos técnicos');
        }
        
        // Inicializa arrays para 31 dias (todos zerados)
        dashboardData.tecnicos = {
            'OSCAR': { dados: new Array(31).fill(0), acumulado: [] },
            'JESSICA': { dados: new Array(31).fill(0), acumulado: [] }
        };
        
        // Processa os dados dos técnicos
        const dadosTecnicos = linhas.slice(indiceDados + 1, Math.min(indiceDados + 32, linhas.length));
        
        dadosTecnicos.forEach((linha) => {
            const colunas = linha.split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (colunas.length >= 3) {
                // Extrai a data da primeira coluna
                const dataStr = colunas[0];
                const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                
                if (match) {
                    const dia = parseInt(match[1]);
                    const mes = parseInt(match[2]);
                    const ano = parseInt(match[3]);
                    
                    // Verifica se é Agosto 2025 e dia válido
                    if (mes === 8 && ano === 2025 && dia >= 1 && dia <= 31) {
                        const oscar = parseInt(colunas[1]) || 0;
                        const jessica = parseInt(colunas[2]) || 0;
                        
                        // Coloca os dados no índice correto (dia - 1)
                        dashboardData.tecnicos.OSCAR.dados[dia - 1] = oscar;
                        dashboardData.tecnicos.JESSICA.dados[dia - 1] = jessica;
                    }
                }
            }
        });
        
        // Calcula acumulados
        let oscarTotal = 0, jessicaTotal = 0;
        for (let i = 0; i < 31; i++) {
            oscarTotal += dashboardData.tecnicos.OSCAR.dados[i];
            jessicaTotal += dashboardData.tecnicos.JESSICA.dados[i];
            dashboardData.tecnicos.OSCAR.acumulado.push(oscarTotal);
            dashboardData.tecnicos.JESSICA.acumulado.push(jessicaTotal);
        }
        
        dashboardData.labels = Array.from({length: 31}, (_, i) => (i+1).toString());
        dashboardData.totalColetado = oscarTotal + jessicaTotal;
        dashboardData.totalPendente = dashboardData.totalAtivos - dashboardData.totalColetado;
        dashboardData.percentualProgresso = ((dashboardData.totalColetado / dashboardData.totalAtivos) * 100).toFixed(1);
        
        console.log('Dados processados com sucesso:', {
            oscar: oscarTotal,
            jessica: jessicaTotal,
            total: dashboardData.totalColetado
        });
        
        // Atualiza interface
        atualizarInterface();
        
    } catch (error) {
        console.error('Erro ao processar CSV:', error);
        usarDadosEstaticos();
    }
}

// FALLBACK COM DADOS ESTÁTICOS
function usarDadosEstaticos() {
    console.log('Carregando dados estáticos...');
    
    // Inicializa arrays para 31 dias (todos zerados)
    dashboardData.tecnicos = {
        'OSCAR': { dados: new Array(31).fill(0), acumulado: [] },
        'JESSICA': { dados: new Array(31).fill(0), acumulado: [] }
    };
    
    // Dados estáticos baseados na planilha (posicionados corretamente por data)
    const dadosEstaticosOscar = {
        4: 38, 5: 18, 6: 27, 7: 37, 8: 13, 11: 28, 12: 55, 13: 11, 14: 14, 15: 40,
        18: 99, 20: 30, 24: 16
    };
    
    const dadosEstaticosJessica = {
        12: 3, 13: 10, 14: 37, 17: 41, 18: 42, 19: 7, 20: 8, 21: 1, 24: 14, 25: 61
    };
    
    // Preenche os dados nos dias corretos
    for (const [dia, valor] of Object.entries(dadosEstaticosOscar)) {
        dashboardData.tecnicos.OSCAR.dados[dia - 1] = valor;
    }
    
    for (const [dia, valor] of Object.entries(dadosEstaticosJessica)) {
        dashboardData.tecnicos.JESSICA.dados[dia - 1] = valor;
    }
    
    // Calcula acumulados
    let oscarAcc = 0, jessicaAcc = 0;
    for (let i = 0; i < 31; i++) {
        oscarAcc += dashboardData.tecnicos.OSCAR.dados[i];
        jessicaAcc += dashboardData.tecnicos.JESSICA.dados[i];
        dashboardData.tecnicos.OSCAR.acumulado.push(oscarAcc);
        dashboardData.tecnicos.JESSICA.acumulado.push(jessicaAcc);
    }
    
    dashboardData.labels = Array.from({length: 31}, (_, i) => (i+1).toString());
    dashboardData.totalColetado = oscarAcc + jessicaAcc;
    dashboardData.totalPendente = dashboardData.totalAtivos - dashboardData.totalColetado;
    dashboardData.percentualProgresso = ((dashboardData.totalColetado / dashboardData.totalAtivos) * 100).toFixed(1);
    
    atualizarInterface();
}

// ATUALIZAR TODA A INTERFACE
function atualizarInterface() {
    atualizarEstatisticas();
    atualizarEquipe();
    criarGraficos();
    gerarCalendario();
}

// ATUALIZAR ESTATÍSTICAS
function atualizarEstatisticas() {
    document.getElementById('coletados').textContent = dashboardData.totalColetado.toLocaleString();
    document.getElementById('pendentes').textContent = dashboardData.totalPendente.toLocaleString();
    document.getElementById('progresso').textContent = dashboardData.percentualProgresso + '%';
    document.getElementById('lastUpdate').textContent = dashboardData.ultimaAtualizacao;
    
    const progressoNum = parseFloat(dashboardData.percentualProgresso);
    document.getElementById('coletadosProgress').style.width = progressoNum + '%';
    document.getElementById('pendentesProgress').style.width = (100 - progressoNum) + '%';
    document.getElementById('progressoProgress').style.width = progressoNum + '%';
}

// ATUALIZAR SEÇÃO DA EQUIPE
function atualizarEquipe() {
    const oscarTotal = dashboardData.tecnicos.OSCAR.acumulado[30] || 0;
    const jessicaTotal = dashboardData.tecnicos.JESSICA.acumulado[30] || 0;
    const totalGeral = oscarTotal + jessicaTotal;
    
    const teamHTML = `
        <div class="team-member">
            <div class="member-avatar oscar">OS</div>
            <div class="member-info">
                <div class="member-name">Oscar Silva</div>
                <div class="member-role">Técnico Especialista</div>
                <div class="member-progress-container">
                    <div class="member-progress-bar">
                        <div class="member-progress-fill oscar" style="width: ${totalGeral > 0 ? (oscarTotal/totalGeral*100).toFixed(1) : 0}%;"></div>
                    </div>
                </div>
            </div>
            <div class="member-stats">
                <div class="member-count">${oscarTotal}</div>
                <div class="member-rate">${(oscarTotal/31).toFixed(1)} por dia</div>
            </div>
        </div>
        <div class="team-member">
            <div class="member-avatar jessica">JS</div>
            <div class="member-info">
                <div class="member-name">Jessica Santos</div>
                <div class="member-role">Técnica Especialista</div>
                <div class="member-progress-container">
                    <div class="member-progress-bar">
                        <div class="member-progress-fill jessica" style="width: ${totalGeral > 0 ? (jessicaTotal/totalGeral*100).toFixed(1) : 0}%;"></div>
                    </div>
                </div>
            </div>
            <div class="member-stats">
                <div class="member-count">${jessicaTotal}</div>
                <div class="member-rate">${(jessicaTotal/31).toFixed(1)} por dia</div>
            </div>
        </div>
    `;
    
    document.getElementById('teamMembers').innerHTML = teamHTML;
}

// FUNÇÃO PARA GERAR DADOS COMPLETOS DO MÊS
function gerarDadosCompletosMes() {
    // Gera todos os dias de Agosto 2025 (31 dias)
    const diasDoMes = [];
    const dadosOscarCompletos = [];
    const dadosJessicaCompletos = [];
    const acumuladoOscarCompleto = [];
    const acumuladoJessicaCompleto = [];
    const totalAcumuladoCompleto = [];
    const metaAcumuladaCompleta = [];
    
    let oscarAcc = 0;
    let jessicaAcc = 0;
    
    for (let dia = 1; dia <= 31; dia++) {
        diasDoMes.push(dia.toString());
        
        // Busca o valor do dia nos dados existentes ou usa 0
        const oscarDia = (dia <= dashboardData.tecnicos.OSCAR.dados.length) 
            ? (dashboardData.tecnicos.OSCAR.dados[dia - 1] || 0) 
            : 0;
        const jessicaDia = (dia <= dashboardData.tecnicos.JESSICA.dados.length) 
            ? (dashboardData.tecnicos.JESSICA.dados[dia - 1] || 0) 
            : 0;
        
        dadosOscarCompletos.push(oscarDia);
        dadosJessicaCompletos.push(jessicaDia);
        
        // Calcula acumulados
        oscarAcc += oscarDia;
        jessicaAcc += jessicaDia;
        
        acumuladoOscarCompleto.push(oscarAcc);
        acumuladoJessicaCompleto.push(jessicaAcc);
        totalAcumuladoCompleto.push(oscarAcc + jessicaAcc);
        
        // Meta de 60 por dia (acumulativa)
        metaAcumuladaCompleta.push(dia * 60);
    }
    
    return {
        labels: diasDoMes,
        oscarDados: dadosOscarCompletos,
        jessicaDados: dadosJessicaCompletos,
        oscarAcumulado: acumuladoOscarCompleto,
        jessicaAcumulado: acumuladoJessicaCompleto,
        totalAcumulado: totalAcumuladoCompleto,
        metaAcumulada: metaAcumuladaCompleta
    };
}

// CRIAR GRÁFICOS
function criarGraficos() {
    console.log('Iniciando criação dos gráficos...');
    
    try {
        // Remove indicadores de loading
        document.getElementById('loadingLine').style.display = 'none';
        document.getElementById('loadingBar').style.display = 'none';
        document.getElementById('lineChart').style.display = 'block';
        document.getElementById('barChart').style.display = 'block';
        
        // Gera dados completos do mês
        const dadosCompletos = gerarDadosCompletosMes();
        console.log('Dados completos gerados:', dadosCompletos);
        
        // Limpa gráficos existentes
        const ctx1 = document.getElementById('lineChart');
        const ctx2 = document.getElementById('barChart');
        
        if (window.lineChartInstance) {
            window.lineChartInstance.destroy();
        }
        if (window.barChartInstance) {
            window.barChartInstance.destroy();
        }
        
        // Gráfico de linha - Evolução com todos os dias
        window.lineChartInstance = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: dadosCompletos.labels,
                datasets: [
                    {
                        label: 'Total Acumulado',
                        data: dadosCompletos.totalAcumulado,
                        borderColor: '#1a202c',
                        backgroundColor: 'rgba(26,32,44,0.05)',
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2
                    },
                    {
                        label: 'Oscar (por dia)',
                        data: dadosCompletos.oscarDados,
                        borderColor: '#22c55e',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 1.5
                    },
                    {
                        label: 'Jessica (por dia)',
                        data: dadosCompletos.jessicaDados,
                        borderColor: '#0e7490',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 1.5
                    },
                    {
                        label: 'Meta (60/dia)',
                        data: dadosCompletos.metaAcumulada,
                        borderColor: '#a0aec0',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        pointHoverRadius: 3,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: false,
                            boxWidth: 12,
                            boxHeight: 2,
                            padding: 20,
                            font: { size: 12, weight: '300' },
                            color: '#718096'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { 
                            font: { size: 11, weight: '300' },
                            color: '#a0aec0',
                            maxTicksLimit: 31
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f7fafc', lineWidth: 1 },
                        border: { display: false },
                        ticks: { font: { size: 11, weight: '300' }, color: '#a0aec0' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        console.log('Gráfico de linha criado com sucesso');

        // Gráfico de barras - Performance Individual
        const oscarFinal = dadosCompletos.oscarAcumulado[dadosCompletos.oscarAcumulado.length - 1] || 0;
        const jessicaFinal = dadosCompletos.jessicaAcumulado[dadosCompletos.jessicaAcumulado.length - 1] || 0;
        
        window.barChartInstance = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Oscar', 'Jessica'],
                datasets: [
                    {
                        label: 'Coletado',
                        data: [oscarFinal, jessicaFinal],
                        backgroundColor: ['#22c55e', '#0e7490'],
                        borderWidth: 0,
                        barThickness: 40
                    },
                    {
                        label: 'Meta (584)',
                        data: [584, 584],
                        type: 'line',
                        borderColor: '#e53e3e',
                        borderWidth: 1.5,
                        fill: false,
                        pointBackgroundColor: '#e53e3e',
                        pointBorderWidth: 0,
                        pointRadius: 3,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: false,
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 20,
                            font: { size: 12, weight: '300' },
                            color: '#718096'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { 
                            font: { size: 12, weight: '400' },
                            color: '#4a5568'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 650,
                        grid: { 
                            color: '#f7fafc',
                            lineWidth: 1
                        },
                        border: { display: false },
                        ticks: { 
                            font: { size: 11, weight: '300' },
                            color: '#a0aec0'
                        }
                    }
                }
            }
        });

        console.log('Gráfico de barras criado com sucesso');

    } catch (error) {
        console.error('Erro ao criar gráficos:', error);
        
        // Mostra os indicadores de loading novamente em caso de erro
        document.getElementById('loadingLine').style.display = 'block';
        document.getElementById('loadingBar').style.display = 'block';
        document.getElementById('lineChart').style.display = 'none';
        document.getElementById('barChart').style.display = 'none';
    }
}

// GERAR CALENDÁRIO
function gerarCalendario() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Cabeçalhos dos dias
    const dayHeaders = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];
    dayHeaders.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });

    // Configuração do mês (Agosto 2025)
    const year = 2025;
    const monthIndex = 7; // Agosto = 7 (0-based)
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const startDayIndex = new Date(year, monthIndex, 1).getDay();

    // Células vazias para alinhar o primeiro dia
    for (let i = 0; i < startDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }

    // Detectar data atual
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && today.getMonth() === monthIndex);

    // Gerar dias do mês
    for (let d = 1; d <= totalDays; d++) {
        const div = document.createElement('div');
        div.textContent = d;
        const dayIndex = (startDayIndex + d - 1) % 7;

        if (dayIndex === 0 || dayIndex === 6) {
            div.className = 'calendar-day weekend';
        } else if (isCurrentMonth && d === today.getDate()) {
            div.className = 'calendar-day today';
        } else {
            div.className = 'calendar-day work-day';
        }

        calendarGrid.appendChild(div);
    }
}

// AUTO-REFRESH A CADA 5 MINUTOS
function configurarAutoRefresh() {
    setInterval(() => {
        console.log('Atualizando dados automaticamente...');
        carregarDadosPlanilha();
    }, 5 * 60 * 1000); // 5 minutos
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializando...');
    
    // Carrega dados iniciais
    carregarDadosPlanilha();
    
    // Configura auto-refresh
    configurarAutoRefresh();
    
    console.log('Dashboard carregado com sucesso!');
});
