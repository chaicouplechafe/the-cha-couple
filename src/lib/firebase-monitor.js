// Firebase Firestore operation monitoring
// Tracks reads, writes, and deletes for cost analysis

const OPERATION_TYPES = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  LISTEN: 'listen', // Real-time listener
};

class FirestoreMonitor {
  constructor() {
    this.operations = {
      reads: 0,
      writes: 0,
      deletes: 0,
      listens: 0,
    };
    this.operationLog = []; // Detailed log for debugging
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_FIREBASE_MONITORING === 'true';
  }

  logOperation(type, count = 1, details = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      type,
      count,
      timestamp,
      ...details,
    };

    // Update counters
    switch (type) {
      case OPERATION_TYPES.READ:
        this.operations.reads += count;
        break;
      case OPERATION_TYPES.WRITE:
        this.operations.writes += count;
        break;
      case OPERATION_TYPES.DELETE:
        this.operations.deletes += count;
        break;
      case OPERATION_TYPES.LISTEN:
        this.operations.listens += count;
        break;
    }

    // Store in log (keep last 100 entries)
    this.operationLog.push(logEntry);
    if (this.operationLog.length > 100) {
      this.operationLog.shift();
    }

    // Console output
    const emoji = {
      [OPERATION_TYPES.READ]: '📖',
      [OPERATION_TYPES.WRITE]: '✍️',
      [OPERATION_TYPES.DELETE]: '🗑️',
      [OPERATION_TYPES.LISTEN]: '👂',
    }[type] || '📊';

    const context = details.endpoint ? ` [${details.endpoint}]` : '';
    const docInfo = details.document ? ` (${details.document})` : '';
    console.log(
      `${emoji} [Firestore ${type.toUpperCase()}]: ${count} operation(s)${context}${docInfo}`
    );

    // Log summary every 50 operations
    if (this.getTotalOperations() % 50 === 0) {
      this.logSummary();
    }
  }

  logRead(count = 1, details = {}) {
    this.logOperation(OPERATION_TYPES.READ, count, details);
  }

  logWrite(count = 1, details = {}) {
    this.logOperation(OPERATION_TYPES.WRITE, count, details);
  }

  logDelete(count = 1, details = {}) {
    this.logOperation(OPERATION_TYPES.DELETE, count, details);
  }

  logListen(count = 1, details = {}) {
    this.logOperation(OPERATION_TYPES.LISTEN, count, details);
  }

  getTotalOperations() {
    return (
      this.operations.reads +
      this.operations.writes +
      this.operations.deletes +
      this.operations.listens
    );
  }

  getSummary() {
    return {
      ...this.operations,
      total: this.getTotalOperations(),
      estimatedCost: this.estimateCost(),
    };
  }

  estimateCost() {
    // Firebase pricing (as of 2024):
    // Reads: $0.06 per 100,000
    // Writes: $0.18 per 100,000
    // Deletes: $0.02 per 100,000
    // Listens are counted as reads
    const readCost = ((this.operations.reads + this.operations.listens) / 100000) * 0.06;
    const writeCost = (this.operations.writes / 100000) * 0.18;
    const deleteCost = (this.operations.deletes / 100000) * 0.02;
    return {
      reads: readCost,
      writes: writeCost,
      deletes: deleteCost,
      total: readCost + writeCost + deleteCost,
    };
  }

  logSummary() {
    const summary = this.getSummary();
    const cost = summary.estimatedCost;
    console.log('\n📊 === Firestore Operations Summary ===');
    console.log(`📖 Reads: ${summary.reads.toLocaleString()}`);
    console.log(`✍️  Writes: ${summary.writes.toLocaleString()}`);
    console.log(`🗑️  Deletes: ${summary.deletes.toLocaleString()}`);
    console.log(`👂 Listens: ${summary.listens.toLocaleString()}`);
    console.log(`📈 Total: ${summary.total.toLocaleString()}`);
    console.log(`💰 Estimated Cost: $${cost.total.toFixed(4)}`);
    console.log('========================================\n');
  }

  reset() {
    this.operations = {
      reads: 0,
      writes: 0,
      deletes: 0,
      listens: 0,
    };
    this.operationLog = [];
  }

  getLog() {
    return {
      summary: this.getSummary(),
      recentOperations: this.operationLog.slice(-20), // Last 20 operations
    };
  }
}

// Singleton instance
const monitor = new FirestoreMonitor();

// Export convenience functions
export function logFirestoreOperation(type, count = 1, details = {}) {
  monitor.logOperation(type, count, details);
}

export function logFirestoreRead(count = 1, details = {}) {
  monitor.logRead(count, details);
}

export function logFirestoreWrite(count = 1, details = {}) {
  monitor.logWrite(count, details);
}

export function logFirestoreDelete(count = 1, details = {}) {
  monitor.logDelete(count, details);
}

export function logFirestoreListen(count = 1, details = {}) {
  monitor.logListen(count, details);
}

export function getFirestoreSummary() {
  return monitor.getSummary();
}

export function logFirestoreSummary() {
  monitor.logSummary();
}

export function resetFirestoreMonitoring() {
  monitor.reset();
}

export function getFirestoreLog() {
  return monitor.getLog();
}

// Export the monitor instance for advanced usage
export default monitor;


