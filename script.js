let isRunning = false;
let processes = [];
let processIdCounter = 1000;
let utilizationChart, cpuPieChart, memoryPieChart;
let timeLabels = [];
let cpuData = [];
let memData = [];
let systemOverloaded = false;
let overloadIntensity = 0; // 0-100 scale
let systemStartTime = null;
let sortBy = 'cpu'; // default sort
let thermalTemp = 45; // temperature in celsius
let cpuAggregation = 'sum'; // 'average' | 'sum' | 'max'
let autoKillEnabled = true; // auto-kill top process during critical overload
let lastAutoKillTime = 0; // throttle auto-kill to every 3 seconds

const processNames = [
    'Chrome Browser', 'Visual Studio Code', 'Database Server', 'Web Server',
    'Python Script', 'Java Application', 'Node.js Server', 'Docker Container',
    'Excel Spreadsheet', 'Video Encoder', 'File Indexer', 'System Monitor'
];

// Initialize charts
function initCharts() {
    // Utilization over time chart
    const ctx1 = document.getElementById('utilizationChart').getContext('2d');
    utilizationChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'CPU Usage %',
                data: cpuData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }, {
                label: 'Memory Usage %',
                data: memData,
                borderColor: '#f56565',
                backgroundColor: 'rgba(245, 101, 101, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // CPU pie chart
    const ctx2 = document.getElementById('cpuChart').getContext('2d');
    cpuPieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#667eea', '#764ba2', '#f6ad55', '#48bb78', '#f56565',
                    '#4299e1', '#ed8936', '#9f7aea', '#38b2ac', '#ed64a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Memory pie chart
    const ctx3 = document.getElementById('memoryChart').getContext('2d');
    memoryPieChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#667eea', '#764ba2', '#f6ad55', '#48bb78', '#f56565',
                    '#4299e1', '#ed8936', '#9f7aea', '#38b2ac', '#ed64a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createProcess() {
    const name = processNames[Math.floor(Math.random() * processNames.length)];
    return {
        pid: processIdCounter++,
        name: name,
        cpu: Math.random() * 12 + 3,
        memory: Math.random() * 10 + 3,
        priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        status: 'Running'
    };
}

function addProcess() {
    processes.push(createProcess());
    updateDisplay();
}

function startSimulation() {
    if (isRunning) return;
    isRunning = true;
    document.getElementById('status').className = 'status running';
    document.getElementById('status').innerHTML = '▶️ Running';

    // Start or reset uptime timer
    systemStartTime = Date.now();

    // Initialize with some processes
    if (processes.length === 0) {
        for (let i = 0; i < 6; i++) {
            processes.push(createProcess());
        }
    }

    simulationLoop();
}

function stopSimulation() {
    isRunning = false;
    document.getElementById('status').className = 'status stopped';
    document.getElementById('status').innerHTML = '⏸️ Stopped';
}

function simulationLoop() {
    if (!isRunning) return;

    // Update process values with realistic fluctuation
    processes.forEach(proc => {
        proc.cpu = Math.max(1, Math.min(95, proc.cpu + (Math.random() - 0.5) * 10));
        proc.memory = Math.max(1, Math.min(90, proc.memory + (Math.random() - 0.5) * 8));
    });

    // Randomly add/remove processes
    if (Math.random() < 0.1 && processes.length < 12) {
        processes.push(createProcess());
    }
    if (Math.random() < 0.05 && processes.length > 3) {
        processes.splice(Math.floor(Math.random() * processes.length), 1);
    }

    updateDisplay();

    setTimeout(simulationLoop, 2000);
}

function updateDisplay() {
    // Calculate total CPU and memory according to aggregation mode
    const cpuSum = processes.reduce((sum, p) => sum + p.cpu, 0);
    const memSum = processes.reduce((sum, p) => sum + p.memory, 0);
    let totalCPU = 0;
    let totalMemory = 0;
    // compute avg/sum/max for display details
    const cpuAvg = processes.length ? (cpuSum / processes.length) : 0;
    const memAvg = processes.length ? (memSum / processes.length) : 0;
    const cpuMax = processes.length ? Math.max(...processes.map(p => p.cpu)) : 0;
    const memMax = processes.length ? Math.max(...processes.map(p => p.memory)) : 0;
    const cpuSumCapped = Math.min(100, cpuSum);
    const memSumCapped = Math.min(100, memSum);

    if (cpuAggregation === 'sum') {
        totalCPU = cpuSumCapped;
        totalMemory = memSumCapped;
    } else if (cpuAggregation === 'max') {
        totalCPU = cpuMax;
        totalMemory = memMax;
    } else { // average
        totalCPU = cpuAvg;
        totalMemory = memAvg;
    }
    totalCPU = Math.min(100, totalCPU);
    totalMemory = Math.min(100, totalMemory);

    // Update metrics
    document.getElementById('cpuValue').textContent = totalCPU.toFixed(1) + '%';
    document.getElementById('memValue').textContent = totalMemory.toFixed(1) + '%';
    document.getElementById('processCount').textContent = processes.length;

    // Update extra displays (Avg / Sum / Max)
    const cpuExtra = document.getElementById('cpuExtra');
    const memExtra = document.getElementById('memExtra');
    if (cpuExtra) cpuExtra.textContent = `Avg: ${cpuAvg.toFixed(1)}% • Sum: ${cpuSumCapped.toFixed(1)}% • Max: ${cpuMax.toFixed(1)}%`;
    if (memExtra) memExtra.textContent = `Avg: ${memAvg.toFixed(1)}% • Sum: ${memSumCapped.toFixed(1)}% • Max: ${memMax.toFixed(1)}%`;

    // Update progress bars
    const cpuProgress = document.getElementById('cpuProgress');
    cpuProgress.style.width = totalCPU + '%';
    cpuProgress.textContent = totalCPU.toFixed(1) + '%';
    cpuProgress.className = 'progress-fill ' + (totalCPU > 80 ? 'danger' : totalCPU > 60 ? 'warning' : '');

    const memProgress = document.getElementById('memProgress');
    memProgress.style.width = totalMemory + '%';
    memProgress.textContent = totalMemory.toFixed(1) + '%';
    memProgress.className = 'progress-fill ' + (totalMemory > 80 ? 'danger' : totalMemory > 60 ? 'warning' : '');

    // Update bottleneck alerts
    updateBottlenecks(totalCPU, totalMemory);
    
    // Update system health
    updateSystemHealth(totalCPU, totalMemory);

    // Update process table
    updateProcessTable();

    // Update charts
    updateCharts(totalCPU, totalMemory);
}

function updateBottlenecks(cpu, mem) {
    const alertsDiv = document.getElementById('bottleneckAlerts');
    alertsDiv.innerHTML = '';

    if (cpu > 80) {
        alertsDiv.innerHTML += `
            <div class="alert alert-danger pulse">
                🔴 CRITICAL: CPU bottleneck detected at ${cpu.toFixed(1)}%
            </div>`;
    } else if (cpu > 60) {
        alertsDiv.innerHTML += `
            <div class="alert alert-warning">
                🟡 WARNING: High CPU usage at ${cpu.toFixed(1)}%
            </div>`;
    }

    if (mem > 80) {
        alertsDiv.innerHTML += `
            <div class="alert alert-danger pulse">
                🔴 CRITICAL: Memory bottleneck detected at ${mem.toFixed(1)}%
            </div>`;
    } else if (mem > 60) {
        alertsDiv.innerHTML += `
            <div class="alert alert-warning">
                🟡 WARNING: High memory usage at ${mem.toFixed(1)}%
            </div>`;
    }

    if (cpu < 60 && mem < 60) {
        alertsDiv.innerHTML = `
            <div class="alert alert-success">
                ✅ System running optimally
            </div>`;
    }

    updateSuggestions(cpu, mem);
}

function updateSuggestions(cpu, mem) {
    const suggestionsUl = document.getElementById('suggestions');
    suggestionsUl.innerHTML = '';

    if (cpu > 80 || mem > 80) {
        const topProcesses = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 3);
        suggestionsUl.innerHTML += `<li>Consider reducing priority for high-usage processes</li>`;
        suggestionsUl.innerHTML += `<li>Top consumers: ${topProcesses.map(p => p.name).join(', ')}</li>`;
        suggestionsUl.innerHTML += `<li>Recommend reallocating resources from low-priority tasks</li>`;
    } else if (cpu > 60 || mem > 60) {
        suggestionsUl.innerHTML += `<li>Monitor system for potential bottlenecks</li>`;
        suggestionsUl.innerHTML += `<li>Resources allocated within acceptable range</li>`;
    } else {
        suggestionsUl.innerHTML += `<li>System resources well-balanced</li>`;
        suggestionsUl.innerHTML += `<li>All processes running within normal parameters</li>`;
        suggestionsUl.innerHTML += `<li>No optimization required at this time</li>`;
    }
}

function sortProcesses(criteria) {
    sortBy = criteria;
    updateProcessTable();
}

function killProcess(pid) {
    processes = processes.filter(p => p.pid !== pid);
    updateDisplay();
}

function killTopProcess() {
    if (processes.length > 0) {
        const topProc = processes.reduce((max, p) => p.cpu > max.cpu ? p : max);
        killProcess(topProc.pid);
    }
}

function updateProcessTable() {
    const tbody = document.getElementById('processTableBody');
    tbody.innerHTML = '';

    let sorted = [...processes];
    if (sortBy === 'cpu') {
        sorted.sort((a, b) => b.cpu - a.cpu);
    } else if (sortBy === 'memory') {
        sorted.sort((a, b) => b.memory - a.memory);
    }

    sorted.forEach(proc => {
        const row = tbody.insertRow();
        const priorityColor = proc.priority === 'High' ? 'priority-high' : proc.priority === 'Medium' ? 'priority-medium' : 'priority-low';
        const isCritical = proc.cpu > 80 || proc.memory > 80;
        const isWarning = (proc.cpu > 60 || proc.memory > 60) && !isCritical;
        
        row.className = isCritical ? 'process-row-critical' : isWarning ? 'process-row-warning' : '';
        row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.name}</td>
            <td><strong>${proc.cpu.toFixed(1)}%</strong></td>
            <td><strong>${proc.memory.toFixed(1)}%</strong></td>
            <td><span class="priority-badge ${priorityColor}">${proc.priority}</span></td>
            <td>${proc.status}</td>
            <td><button class="action-btn kill" onclick="killProcess(${proc.pid})">Kill</button></td>
        `;
    });
}

function updateCharts(cpu, mem) {
    // Update time series
    const now = new Date().toLocaleTimeString();
    timeLabels.push(now);
    cpuData.push(cpu);
    memData.push(mem);

    if (timeLabels.length > 15) {
        timeLabels.shift();
        cpuData.shift();
        memData.shift();
    }

    utilizationChart.update();

    // Update pie charts
    const topProcesses = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 5);
    cpuPieChart.data.labels = topProcesses.map(p => p.name);
    cpuPieChart.data.datasets[0].data = topProcesses.map(p => p.cpu);
    cpuPieChart.update();

    memoryPieChart.data.labels = topProcesses.map(p => p.name);
    memoryPieChart.data.datasets[0].data = topProcesses.map(p => p.memory);
    memoryPieChart.update();
}

function optimizeResources() {
    if (!systemOverloaded) {
        processes.forEach(proc => {
            if (proc.cpu > 60) {
                proc.cpu *= 0.7;
                proc.priority = 'Low';
            }
            if (proc.memory > 60) {
                proc.memory *= 0.7;
            }
        });
        updateDisplay();
        
        const alertsDiv = document.getElementById('bottleneckAlerts');
        alertsDiv.innerHTML = `
            <div class="alert alert-success">
                ⚡ Resources optimized successfully!
            </div>`;
    } else {
        const alertsDiv = document.getElementById('bottleneckAlerts');
        alertsDiv.innerHTML = `
            <div class="alert alert-danger pulse">
                ❌ Cannot optimize - System is in critical overload state!
            </div>
            <div class="alert alert-warning">
                💡 Tip: Use "Kill Top Process" to reduce system load first
            </div>`;
    }
}

function triggerSystemOverload() {
    if (!isRunning) {
        startSimulation();
    }
    
    systemOverloaded = true;
    overloadIntensity = 100;
    
    // Add many high-demand processes
    for (let i = 0; i < 8; i++) {
        const proc = createProcess();
        proc.cpu = Math.random() * 40 + 50; // 50-90%
        proc.memory = Math.random() * 35 + 50; // 50-85%
        processes.push(proc);
    }
    
    updateDisplay();
}

function clearAllProcesses() {
    processes = [];
    systemOverloaded = false;
    overloadIntensity = 0;
    // Reset uptime since system was cleared
    systemStartTime = null;
    updateDisplay();
}

function updateSystemHealth(cpu, mem) {
    // Calculate overall system load (0-100)
    const systemLoad = Math.max(cpu, mem);
    
    // Update thermal temperature based on load
    thermalTemp = 45 + (systemLoad * 0.5);
    
    // Update load indicator
    const loadValue = document.getElementById('loadValue');
    const loadProgress = document.getElementById('loadProgress');
    const statusAlert = document.getElementById('systemStatusAlert');
    const thermalIndicator = document.getElementById('thermalIndicator');
    const thermalStatus = document.getElementById('thermalStatus');
    
    let loadStatus = 'Normal';
    let loadClass = '';
    let thermalClass = 'thermal-cool';
    let thermalText = 'Cool';
    
    if (systemLoad > 90) {
        loadStatus = '🔴 CRITICAL OVERLOAD';
        loadClass = 'danger';
        systemOverloaded = true;
        overloadIntensity = Math.min(100, systemLoad);
        thermalClass = 'thermal-critical';
        thermalText = `Critical (${thermalTemp.toFixed(0)}°C)`;
    } else if (systemLoad > 75) {
        loadStatus = '🟠 SEVERE OVERLOAD';
        loadClass = 'danger';
        systemOverloaded = true;
        overloadIntensity = systemLoad;
        thermalClass = 'thermal-hot';
        thermalText = `Hot (${thermalTemp.toFixed(0)}°C)`;
    } else if (systemLoad > 60) {
        loadStatus = '🟡 HIGH LOAD';
        loadClass = 'warning';
        systemOverloaded = true;
        overloadIntensity = systemLoad;
        thermalClass = 'thermal-warm';
        thermalText = `Warm (${thermalTemp.toFixed(0)}°C)`;
    } else if (systemLoad > 40) {
        loadStatus = '🟢 MODERATE';
        loadClass = 'warning';
        systemOverloaded = false;
        overloadIntensity = 0;
        thermalClass = 'thermal-warm';
        thermalText = `Warm (${thermalTemp.toFixed(0)}°C)`;
    } else {
        loadStatus = '✅ NORMAL';
        systemOverloaded = false;
        overloadIntensity = 0;
        thermalClass = 'thermal-cool';
        thermalText = `Cool (${thermalTemp.toFixed(0)}°C)`;
    }
    
    // Update uptime
    if (systemStartTime) {
        const elapsed = Math.floor((Date.now() - systemStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('uptimeValue').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    loadValue.textContent = loadStatus;
    loadProgress.style.width = systemLoad + '%';
    loadProgress.textContent = systemLoad.toFixed(1) + '%';
    loadProgress.className = 'progress-fill ' + loadClass;
    
    // Update thermal indicator
    thermalIndicator.className = 'thermal-indicator ' + thermalClass;
    thermalStatus.textContent = thermalText;
    
    // Show overload warnings & trigger auto-kill if critical
    if (systemOverloaded) {
        statusAlert.innerHTML = `
            <div class="alert alert-danger pulse">
                ⚡ SYSTEM OVERLOAD DETECTED!
            </div>
            <div class="alert alert-warning">
                • Process Queue Backlog: ${Math.floor(processes.length * 1.5)} tasks waiting
            </div>
            <div class="alert alert-warning">
                • Response Time: ${(100 + overloadIntensity * 5).toFixed(0)}ms (Normal: 50ms)
            </div>`;

        // Auto-kill top process every 3 seconds during critical overload (>90%)
        if (systemLoad > 90 && autoKillEnabled && Date.now() - lastAutoKillTime > 3000) {
            if (processes.length > 0) {
                const topProc = processes.reduce((max, p) => p.cpu > max.cpu ? p : max);
                killProcess(topProc.pid);
                lastAutoKillTime = Date.now();
            }
        }
    } else {
        statusAlert.innerHTML = `
            <div class="alert alert-success">
                ✅ All systems operational
            </div>`;
    }
}

function toggleAutoKill() {
    autoKillEnabled = !autoKillEnabled;
    const btn = document.getElementById('autoKillBtn');
    btn.textContent = autoKillEnabled ? '🔒 Auto-Kill: ON' : '🔓 Auto-Kill: OFF';
}

// Initialize
window.onload = function() {
    initCharts();
};
