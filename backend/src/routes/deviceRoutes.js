const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.listDevices);
router.post('/', deviceController.registerDevice);
router.delete('/:id', deviceController.removeDevice);

module.exports = router;
