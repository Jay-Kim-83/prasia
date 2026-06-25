const express = require('express');
const router = express.Router();
const tracker = require('./guild-tracker');

const handle = (fn) => async (req, res) => {
    try {
        const result = await fn(req);
        res.json({ ok: true, data: result });
    } catch (e) {
        res.status(400).json({ ok: false, error: e.message });
    }
};

router.get('/status', handle(() => tracker.getSnapshotInfo()));

router.get('/pending', handle(() => tracker.getPendingMigrations()));

router.get('/confirmed', handle(() => tracker.getConfirmedMigrations()));

router.post('/pending/:id/confirm', handle((req) => {
    const { candidateIndex } = req.body;
    if (candidateIndex === undefined) throw new Error('candidateIndex 필드가 필요합니다');
    return tracker.confirmMigration(req.params.id, candidateIndex, req.user?.id);
}));

router.post('/pending/:id/dismiss', handle((req) => {
    tracker.dismissMigration(req.params.id, req.user?.id);
    return null;
}));

router.post('/detect', handle(() => tracker.runAutoDetection()));

router.post('/snapshot', handle(() => {
    const count = tracker.snapshotAllGuilds();
    return { savedGuilds: count };
}));

module.exports = router;
