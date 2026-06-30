const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const RANKINGS_FILE = path.join(DATA_DIR, 'rankings.json');
const STATE_FILE = path.join(DATA_DIR, 'char_guild_state.json');
const HISTORY_FILE = path.join(DATA_DIR, 'char_guild_history.json');

const readJson = (file, fallback) => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return fallback; }
};
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data), 'utf8');

const keyOf = (nickname, world, realm) => `${nickname}\t${world || ''}\t${realm || ''}`;

function trackGuildChanges() {
    const { characters } = readJson(RANKINGS_FILE, { characters: [] });
    if (!characters.length) return { changes: 0 };

    const state = readJson(STATE_FILE, {});
    const history = readJson(HISTORY_FILE, {});
    const now = new Date().toISOString();
    let changes = 0;

    for (const c of characters) {
        if (!c.nickname) continue;
        const key = keyOf(c.nickname, c.world, c.realm);
        const curGuild = c.guild || '';
        const prev = state[key];

        if (prev === undefined) {
            state[key] = curGuild;
            continue;
        }
        if (prev !== curGuild) {
            if (!history[key]) history[key] = [];
            history[key].push({ from: prev, to: curGuild, at: now });
            state[key] = curGuild;
            changes++;
        }
    }

    writeJson(STATE_FILE, state);
    if (changes) writeJson(HISTORY_FILE, history);
    return { changes };
}

function getHistory(nickname, world, realm) {
    const history = readJson(HISTORY_FILE, {});
    return history[keyOf(nickname, world, realm)] || [];
}

module.exports = { trackGuildChanges, getHistory };
