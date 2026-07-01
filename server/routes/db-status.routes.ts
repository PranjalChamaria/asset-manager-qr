import { Router } from 'express';
import { dbStatusController } from '../controllers/db-status.controller.js';

const router = Router();

router.get('/db-status', dbStatusController.getDbStatus);

export default router;
