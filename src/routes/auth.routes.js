const { Router } = require('express');
const ctl = require('../controllers/auth.controller');

const router = Router();

router.post('/registro', ctl.registrar);
router.post('/login', ctl.iniciarSesion);

module.exports = router;