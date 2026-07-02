import type { Request, Response } from 'express';
import { healthService } from '../services/health.service.js';

class HealthController {
  getHealth = (_req: Request, res: Response) => {
    const status = healthService.getHealthStatus();
    res.json(status);
  };
}

export const healthController = new HealthController();
