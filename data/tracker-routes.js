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

router.get('/guilds', handle(() => tracker.getTrackedGuilds()));

router.get('/guilds/:id', handle((req) => tracker.getGuildHistory(req.params.id)));

router.post('/guilds', handle((req) => {
    const { guildName, world } = req.body;
    if (!guildName || !world) throw new Error('guildName, world 필드가 필요합니다');
    return tracker.addTrackedGuild(guildName, world, req.user?.id);
}));

router.delete('/guilds/:id', handle((req) => {
    tracker.removeTrackedGuild(req.params.id);
    return null;
}));

router.get('/pending', handle(() => tracker.getPendingMigrations()));

router.post('/pending/:id/confirm', handle((req) => {
    const { candidateIndex } = req.body;
    if (candidateIndex === undefined) throw new Error('candidateIndex 필드가 필요합니다');
    return tracker.confirmMigration(req.params.id, candidateIndex, req.user?.id);
}));

router.post('/pending/:id/dismiss', handle((req) => {
    tracker.dismissMigration(req.params.id, req.user?.id);
    return null;
}));

router.post('/detect', handle(() => tracker.runDetection()));

router.post('/sync', handle(() => {
    tracker.syncMembers();
    return null;
}));

module.exports = router;
