const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMeasurements, createMeasurement, deleteMeasurement } = require('../controllers/bodyMeasurementsController');

router.use(authenticateToken);
router.get('/',      getMeasurements);
router.post('/',     createMeasurement);
router.delete('/:id', deleteMeasurement);
module.exports = router;
