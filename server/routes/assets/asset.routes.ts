import { Router } from 'express';
import { assetController } from '../../controllers/asset.controller.js';

const router = Router();

router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);
router.post('/', assetController.create);
router.put('/:id', assetController.update);
router.post('/:id/restore', assetController.restore);
router.delete('/:id', assetController.remove);
router.delete('/:id/permanent', assetController.destroy);

export default router;
