const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

class OrderMonitor {
    constructor() {
        this.connection = null;
        this.isMonitoring = false;
    }

    async initialize() {
        this.connection = await mysql.createConnection(dbConfig);
    }

    async fetchPendingOrders() {
        if (!this.connection) {
            await this.initialize();
        }
        
        const [rows] = await this.connection.execute(
            'SELECT * FROM orders WHERE status = "pending"'
        );
        return rows;
    }

    async restartMonitoring() {
        try {
            if (!this.connection) {
                await this.initialize();
            }
            
            const pendingOrders = await this.fetchPendingOrders();
            // Process pending orders logic here
            
            this.isMonitoring = true;
        } catch (error) {
            console.error('Error in monitoring:', error);
        }
    }

    async stopMonitoring() {
        this.isMonitoring = false;
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = { OrderMonitor };
