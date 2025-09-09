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

        const revenue = this.generateRealisticTrend(dataPoints, 25000, 45000, 'revenue');
        const users = this.generateRealisticTrend(dataPoints, 800, 1500, 'users');
        const performance = this.generateRealisticTrend(dataPoints, 65, 95, 'performance');

        return {
            revenue: revenue,
            users: users,
            performance: performance,
            timeLabels: timeLabels
        };
    }

    generateRealisticTrend(points, min, max, type) {
        const data = [];
        let currentValue = min + (max - min) * 0.6;
        
        for (let i = 0; i < points; i++) {
            let trend = 0;
            
            switch(type) {
                case 'revenue':
                    trend = i < points * 0.3 ? 0.02 : 
                           i < points * 0.7 ? 0.01 : 0.03;
                    break;
                case 'users':
                    trend = i < points * 0.4 ? 0.015 : 
                           i < points * 0.8 ? -0.005 : 0.025;
                    break;
                case 'performance':
                    trend = Math.sin(i * 0.5) * 0.01;
                    break;
            }
            
            const randomVariation = (Math.random() - 0.5) * 0.1;
            const growthFactor = 1 + trend + randomVariation;
            
            currentValue *= growthFactor;
            currentValue = Math.max(min, Math.min(max, currentValue));
            
            data.push(Math.floor(currentValue));
        }
        
        return data;
    }

    async loadInitialData() {
        await this.updateMetrics();
        await this.updateCharts();
        await this.loadTransactions();
        await this.loadAlerts();
    }

    async updateMetrics() {
        if (!this.baseMetrics) {
            this.baseMetrics = {
                revenue: 147500,
                users: 18750,
                conversion: 4.2,
                response: 185
            };
            this.metricTrends = {
                revenue: 0.08,
                users: 0.12,
                conversion: -0.03,
                response: -0.15
            };
        }

        const timeOfDay = new Date().getHours();
        const dayFactor = timeOfDay >= 9 && timeOfDay <= 17 ? 1.2 : 0.8;
        
        const variance = (Math.random() - 0.5) * 0.15;
        
        const metrics = {
            revenue: Math.floor(this.baseMetrics.revenue * dayFactor * (1 + variance)),
            users: Math.floor(this.baseMetrics.users * dayFactor * (1 + variance)),
            conversion: (this.baseMetrics.conversion * (1 + variance * 0.5)).toFixed(1),
            response: Math.floor(this.baseMetrics.response * (2 - dayFactor) * (1 + variance * 0.3))
        };

        const changes = {
            revenue: (this.metricTrends.revenue * 100 + variance * 50).toFixed(1),
            users: (this.metricTrends.users * 100 + variance * 30).toFixed(1),
            conversion: (this.metricTrends.conversion * 100 + variance * 20).toFixed(1),
            response: (this.metricTrends.response * 100 + variance * 25).toFixed(1)
        };

        document.getElementById('totalRevenue').textContent = `${metrics.revenue.toLocaleString()}`;
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
        const customers = [
            'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Digital Ventures', 
            'Innovation Labs', 'Future Systems', 'NextGen Company', 'Smart Industries',
            'DataFlow Corp', 'CloudTech Ltd', 'Synergy Group', 'Pioneer Enterprises',
            'Quantum Solutions', 'Alpha Technologies', 'Beta Dynamics', 'Gamma Industries'
        ];
        const regions = ['North America', 'Europe', 'Asia', 'Other'];
        const statuses = ['success', 'pending', 'failed'];
        const statusWeights = [0.75, 0.20, 0.05];
        
        const getWeightedStatus = () => {
            const rand = Math.random();
            if (rand < statusWeights[0]) return 'success';
            if (rand < statusWeights[0] + statusWeights[1]) return 'pending';
            return 'failed';
        };

        const transactions = [];
        for (let i = 0; i < 25; i++) {
            const baseAmount = [500, 1200, 2800, 5500, 12000, 25000];
            const amount = baseAmount[Math.floor(Math.random() * baseAmount.length)] + 
                          Math.floor(Math.random() * 3000);
            
            const daysBack = Math.floor(Math.random() * 14);
            const date = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
            
            transactions.push({
                id: `TXN${String(2024001 + i).padStart(7, '0')}`,
                customer: customers[Math.floor(Math.random() * customers.length)],
                amount: amount,
                status: getWeightedStatus(),
                date: date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                }),
                region: regions[Math.floor(Math.random() * regions.length)]
            });
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async loadAlerts() {
        const currentTime = Date.now();
        const alerts = [
            {
                type: 'warning',
                message: 'API response time increased by 15% in the last hour',
                timestamp: new Date(currentTime - 12 * 60000)
            },
            {
                type: 'info',
                message: 'New dashboard feature deployed successfully - Chart export functionality',
                timestamp: new Date(currentTime - 45 * 60000)
            },
            {
                type: 'error',
                message: 'Database connection timeout in EU-West cluster - Auto-recovering',
                timestamp: new Date(currentTime - 8 * 60000)
            },
            {
                type: 'warning',
                message: 'Unusual traffic spike detected from Asia region (+180%)',
                timestamp: new Date(currentTime - 25 * 60000)
            },
            {
                type: 'info',
                message: 'Scheduled backup completed for transaction database',
                timestamp: new Date(currentTime - 3 * 60 * 60000)
            },
            {
                type: 'warning',
                message: 'Memory usage at 85% on primary analytics server',
                timestamp: new Date(currentTime - 6 * 60000)
            }
        ];

        const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp);
        const alertsList = document.getElementById('alertsList');
        
        alertsList.innerHTML = sortedAlerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div>${alert.message}</div>
                <div class="alert-timestamp">${this.formatTimestamp(alert.timestamp)}</div>
            </div>
        `).join('');
    }

    formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours}h ago`;
        return timestamp.toLocaleDateString();
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