class DataPulseDashboard {
    constructor() {
        this.charts = {};
        this.currentFilters = {
            region: '',
            department: '',
            timeRange: '24h'
        };
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.currentFilters.timeRange = e.target.value;
            this.refreshData();
        });
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchTransactions(e.target.value));
        
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeChartType(e.target.dataset.type));
        });
    }

    generateMockData() {
        const timeRange = this.currentFilters.timeRange;
        let dataPoints, timeLabels;
        
        switch(timeRange) {
            case '1h':
                dataPoints = 12;
                timeLabels = Array.from({length: dataPoints}, (_, i) => {
                    const time = new Date(Date.now() - (dataPoints - i - 1) * 5 * 60000);
                    return time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                });
                break;
            case '24h':
                dataPoints = 24;
                timeLabels = Array.from({length: dataPoints}, (_, i) => {
                    const time = new Date(Date.now() - (dataPoints - i - 1) * 60 * 60000);
                    return time.toLocaleTimeString([], {hour: '2-digit'}) + ':00';
                });
                break;
            case '7d':
                dataPoints = 7;
                timeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                break;
            case '30d':
                dataPoints = 30;
                timeLabels = Array.from({length: dataPoints}, (_, i) => `Day ${i + 1}`);
                break;
        }

        return {
            revenue: Array.from({length: dataPoints}, () => Math.floor(Math.random() * 50000) + 10000),
            users: Array.from({length: dataPoints}, () => Math.floor(Math.random() * 1000) + 200),
            performance: Array.from({length: dataPoints}, () => Math.floor(Math.random() * 100) + 50),
            timeLabels: timeLabels
        };
    }

    async loadInitialData() {
        await this.updateMetrics();
        await this.updateCharts();
        await this.loadTransactions();
        await this.loadAlerts();
    }

    async updateMetrics() {
        const baseRevenue = 125000;
        const baseUsers = 15420;
        const baseConversion = 3.2;
        const baseResponse = 245;

        const variance = (Math.random() - 0.5) * 0.2;
        
        const metrics = {
            revenue: Math.floor(baseRevenue * (1 + variance)),
            users: Math.floor(baseUsers * (1 + variance)),
            conversion: (baseConversion * (1 + variance)).toFixed(1),
            response: Math.floor(baseResponse * (1 + Math.random() * 0.5))
        };

        const changes = {
            revenue: (variance * 100).toFixed(1),
            users: ((variance + 0.05) * 100).toFixed(1),
            conversion: ((variance - 0.02) * 100).toFixed(1),
            response: (-(Math.random() * 10)).toFixed(1)
        };

        document.getElementById('totalRevenue').textContent = `$${metrics.revenue.toLocaleString()}`;
        document.getElementById('activeUsers').textContent = metrics.users.toLocaleString();
        document.getElementById('conversionRate').textContent = `${metrics.conversion}%`;
        document.getElementById('responseTime').textContent = `${metrics.response}ms`;

        this.updateMetricChange('revenueChange', changes.revenue);
        this.updateMetricChange('usersChange', changes.users);
        this.updateMetricChange('conversionChange', changes.conversion);
        this.updateMetricChange('responseChange', changes.response);
    }

    updateMetricChange(elementId, change) {
        const element = document.getElementById(elementId);
        const isPositive = parseFloat(change) >= 0;
        element.textContent = `${isPositive ? '+' : ''}${change}%`;
        element.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
    }

    initializeCharts() {
        this.charts.revenue = new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        this.charts.activity = new Chart(document.getElementById('activityChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Active Users',
                    data: [],
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.performance = new Chart(document.getElementById('performanceChart'), {
            type: 'doughnut',
            data: {
                labels: ['Excellent', 'Good', 'Average', 'Poor'],
                datasets: [{
                    data: [45, 30, 20, 5],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async updateCharts() {
        const mockData = this.generateMockData();
        
        this.charts.revenue.data.labels = mockData.timeLabels;
        this.charts.revenue.data.datasets[0].data = mockData.revenue;
        this.charts.revenue.update();

        this.charts.activity.data.labels = mockData.timeLabels;
        this.charts.activity.data.datasets[0].data = mockData.users;
        this.charts.activity.update();

        const performanceData = [
            Math.floor(Math.random() * 20) + 35,
            Math.floor(Math.random() * 15) + 25,
            Math.floor(Math.random() * 10) + 15,
            Math.floor(Math.random() * 10) + 5
        ];
        this.charts.performance.data.datasets[0].data = performanceData;
        this.charts.performance.update();
    }

    async loadTransactions() {
        const transactions = this.generateMockTransactions();
        const tbody = document.getElementById('transactionsBody');
        
        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${transaction.id}</td>
                <td>${transaction.customer}</td>
                <td>$${transaction.amount.toLocaleString()}</td>
                <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                <td>${transaction.date}</td>
                <td>${transaction.region}</td>
            </tr>
        `).join('');
    }

    generateMockTransactions() {
        const customers = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis', 'Tom Wilson', 'Anna Garcia', 'Chris Lee', 'Emma Taylor'];
        const regions = ['North America', 'Europe', 'Asia', 'Other'];
        const statuses = ['success', 'pending', 'failed'];
        
        return Array.from({length: 20}, (_, i) => ({
            id: `TXN${1000 + i}`,
            customer: customers[Math.floor(Math.random() * customers.length)],
            amount: Math.floor(Math.random() * 10000) + 100,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            region: regions[Math.floor(Math.random() * regions.length)]
        }));
    }

    async loadAlerts() {
        const alerts = [
            {
                type: 'warning',
                message: 'High server load detected in US-East region',
                timestamp: new Date(Date.now() - 15 * 60000)
            },
            {
                type: 'info',
                message: 'Scheduled maintenance completed successfully',
                timestamp: new Date(Date.now() - 2 * 60 * 60000)
            },
            {
                type: 'error',
                message: 'Payment gateway timeout - investigating',
                timestamp: new Date(Date.now() - 45 * 60000)
            }
        ];

        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div>${alert.message}</div>
                <div class="alert-timestamp">${alert.timestamp.toLocaleString()}</div>
            </div>
        `).join('');
    }

    changeChartType(type) {
        document.querySelectorAll('.chart-type-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        this.charts.revenue.config.type = type;
        this.charts.revenue.update();
    }

    applyFilters() {
        this.currentFilters.region = document.getElementById('regionFilter').value;
        this.currentFilters.department = document.getElementById('departmentFilter').value;
        this.refreshData();
    }

    searchTransactions(query) {
        const rows = document.querySelectorAll('#transactionsBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    async refreshData() {
        document.getElementById('refreshBtn').disabled = true;
        document.getElementById('refreshBtn').textContent = 'Refreshing...';
        
        await Promise.all([
            this.updateMetrics(),
            this.updateCharts(),
            this.loadTransactions(),
            this.loadAlerts()
        ]);
        
        setTimeout(() => {
            document.getElementById('refreshBtn').disabled = false;
            document.getElementById('refreshBtn').textContent = 'Refresh';
        }, 1000);
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.updateMetrics();
            this.updateCharts();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DataPulseDashboard();
});