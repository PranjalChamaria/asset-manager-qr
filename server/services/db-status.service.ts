import { getDatabase } from '../db/sqlite.js';

class DbStatusService {
  getStatus() {
    const db = getDatabase();
    db.prepare('SELECT 1').get();
    return { database: 'connected' };
  }
}

export const dbStatusService = new DbStatusService();
