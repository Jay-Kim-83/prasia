const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const github = require('../github-sync');

const DATA_DIR = path.join(__dirname);
const CONFIG_FILE = path.join(DATA_DIR, 'boss-config.json');
const CUTS_FILE   = path.join(DATA_DIR, 'boss-cuts.json');

const readJson  = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) writeJson(CONFIG_FILE, { bosses: [], maintenanceDay: 3, maintenanceTime: '22:00' });
    return readJson(CONFIG_FILE);
}
function loadCuts() {
    if (!fs.existsSync(CUTS_FILE)) writeJson(CUTS_FILE, {});
    return readJson(CUTS_FILE);
}

router.get('/config', (req, res) => {
    try { res.json({ ok: true, data: loadConfig() }); }
    catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/config', (req, res) => {
    const { verifyAdminToken } = require('../server');
    if (!verifyAdminToken(req.headers['x-user-token'])) return res.status(403).json({ ok: false, error: '권한 없음' });
    try {
        const { bosses, maintenanceDay, maintenanceTime } = req.body;
        writeJson(CONFIG_FILE, { bosses, maintenanceDay: Number(maintenanceDay), maintenanceTime });
        github.pushFiles(['boss-config.json']).catch(() => {});
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/cuts', (req, res) => {
    try { res.json({ ok: true, data: loadCuts() }); }
    catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/cuts/reset', (req, res) => {
    const { verifyUserToken } = require('../server');
    if (!verifyUserToken(req.headers['x-user-token'])) return res.status(403).json({ ok: false, error: '로그인 필요' });
    try { writeJson(CUTS_FILE, {}); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/cuts/:id', (req, res) => {
    const { verifyUserToken } = require('../server');
    if (!verifyUserToken(req.headers['x-user-token'])) return res.status(403).json({ ok: false, error: '로그인 필요' });
    try {
        const cuts = loadCuts();
        const { cutTime, updatedBy } = req.body;
        cuts[req.params.id] = { cutTime, updatedAt: new Date().toISOString(), updatedBy: updatedBy || 'unknown' };
        writeJson(CUTS_FILE, cuts);
        res.json({ ok: true, data: cuts[req.params.id] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/cuts/:id', (req, res) => {
    const { verifyUserToken } = require('../server');
    if (!verifyUserToken(req.headers['x-user-token'])) return res.status(403).json({ ok: false, error: '로그인 필요' });
    try {
        const cuts = loadCuts();
        delete cuts[req.params.id];
        writeJson(CUTS_FILE, cuts);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
