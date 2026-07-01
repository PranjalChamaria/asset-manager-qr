import type { Request, Response } from 'express';
import { dbStatusService } from '../services/db-status.service.js';

class DbStatusController {
  getDbStatus = (_req: Request, res: Response) => {
    const status = dbStatusService.getStatus();
    res.json(status);
  };
}

export const dbStatusController = new DbStatusController();
