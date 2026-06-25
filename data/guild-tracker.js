const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname);
const TRACKING_FILE = path.join(DATA_DIR, 'guild_tracking.json');
const CANDIDATES_FILE = path.join(DATA_DIR, 'migration_candidates.json');
const RANKINGS_FILE = path.join(DATA_DIR, 'rankings.json');

const MIGRATION_THRESHOLD = 0.3;
const MIN_MATCH_RATE = 0.15;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

function loadTracking() {
    if (!fs.existsSync(TRACKING_FILE)) writeJson(TRACKING_FILE, { guilds: [] });
    return readJson(TRACKING_FILE);
}

function loadCandidates() {
    if (!fs.existsSync(CANDIDATES_FILE)) writeJson(CANDIDATES_FILE, { pending: [], resolved: [] });
    return readJson(CANDIDATES_FILE);
}

function buildGuildMap(characters) {
    const map = {};
    for (const char of characters) {
        if (!char.guild) continue;
        const key = `${char.guild}|${char.world}`;
        if (!map[key]) {
            map[key] = { guildName: char.guild, world: char.world, members: [] };
        }
        map[key].members.push({
            nickname: char.nickname,
            job: char.job,
            level: char.level,
            conquestGrade: char.conquestGrade,
            realm: char.realm
        });
    }
    return map;
}

function findCandidates(lastKnownMembers, guildMap, excludeKey) {
    const trackedSet = new Set(lastKnownMembers.map(m => m.nickname));
    const candidates = [];

    for (const [key, guild] of Object.entries(guildMap)) {
        if (key === excludeKey) continue;

        const matchingNicknames = [];
        const jobChanges = [];

        for (const member of guild.members) {
            if (!trackedSet.has(member.nickname)) continue;
            matchingNicknames.push(member.nickname);
            const prev = lastKnownMembers.find(m => m.nickname === member.nickname);
            if (prev && prev.job !== member.job) {
                jobChanges.push({ nickname: member.nickname, from: prev.job, to: member.job });
            }
        }

        const matchRate = matchingNicknames.length / lastKnownMembers.length;
        if (matchRate < MIN_MATCH_RATE) continue;

        candidates.push({
            guildName: guild.guildName,
            world: guild.world,
            matchCount: matchingNicknames.length,
            matchRate: Math.round(matchRate * 1000) / 10,
            totalMembers: guild.members.length,
            matchingMembers: matchingNicknames,
            jobChanges
        });
    }

    return candidates.sort((a, b) => b.matchRate - a.matchRate);
}

function addTrackedGuild(guildName, world, addedBy = 'system') {
    const tracking = loadTracking();
    const { characters } = readJson(RANKINGS_FILE);
    const guildMap = buildGuildMap(characters);

    const key = `${guildName}|${world}`;
    const found = guildMap[key];
    if (!found) throw new Error(`결사를 찾을 수 없습니다: ${guildName} (${world})`);

    const duplicate = tracking.guilds.find(g => {
        const current = g.history[g.history.length - 1];
        return current && current.guildName === guildName && current.world === world && !current.activeTo;
    });
    if (duplicate) throw new Error(`이미 추적 중인 결사입니다: ${guildName} (${world})`);

    const entry = {
        id: crypto.randomUUID(),
        displayName: `${guildName} (${world})`,
        status: 'active',
        createdAt: new Date().toISOString(),
        history: [{
            guildName,
            world,
            members: found.members,
            memberCount: found.members.length,
            activeFrom: new Date().toISOString(),
            activeTo: null,
            addedBy
        }]
    };

    tracking.guilds.push(entry);
    writeJson(TRACKING_FILE, tracking);
    return entry;
}

function removeTrackedGuild(guildId) {
    const tracking = loadTracking();
    const idx = tracking.guilds.findIndex(g => g.id === guildId);
    if (idx === -1) throw new Error('추적 결사를 찾을 수 없습니다');
    tracking.guilds.splice(idx, 1);
    writeJson(TRACKING_FILE, tracking);
}

function runDetection() {
    const tracking = loadTracking();
    const candidates = loadCandidates();
    const { characters } = readJson(RANKINGS_FILE);
    const guildMap = buildGuildMap(characters);

    let detected = 0;

    for (const guild of tracking.guilds) {
        if (guild.status === 'migrated') continue;

        const current = guild.history[guild.history.length - 1];
        if (!current || current.activeTo !== null) continue;

        const { guildName, world, members: lastKnownMembers } = current;
        const currentKey = `${guildName}|${world}`;
        const currentGuild = guildMap[currentKey];
        const currentCount = currentGuild ? currentGuild.members.length : 0;

        const isMigrated = currentCount < lastKnownMembers.length * MIGRATION_THRESHOLD;

        if (!isMigrated) {
            if (currentGuild) {
                current.members = currentGuild.members;
                current.memberCount = currentGuild.members.length;
            }
            continue;
        }

        const alreadyPending = candidates.pending.some(p => p.trackedGuildId === guild.id);
        if (alreadyPending) continue;

        const found = findCandidates(lastKnownMembers, guildMap, currentKey);
        if (found.length === 0) {
            guild.status = 'missing';
            continue;
        }

        candidates.pending.push({
            id: crypto.randomUUID(),
            trackedGuildId: guild.id,
            trackedGuildDisplayName: guild.displayName,
            originalGuildName: guildName,
            originalWorld: world,
            detectedAt: new Date().toISOString(),
            lastKnownMemberCount: lastKnownMembers.length,
            candidates: found
        });

        guild.status = 'missing';
        detected++;
    }

    writeJson(TRACKING_FILE, tracking);
    writeJson(CANDIDATES_FILE, candidates);

    return { detected };
}

function syncMembers() {
    const tracking = loadTracking();
    const { characters } = readJson(RANKINGS_FILE);
    const guildMap = buildGuildMap(characters);

    for (const guild of tracking.guilds) {
        if (guild.status !== 'active') continue;
        const current = guild.history[guild.history.length - 1];
        if (!current || current.activeTo !== null) continue;

        const key = `${current.guildName}|${current.world}`;
        const found = guildMap[key];
        if (!found) continue;

        current.members = found.members;
        current.memberCount = found.members.length;
    }

    writeJson(TRACKING_FILE, tracking);
}

function confirmMigration(pendingId, candidateIndex, confirmedBy = 'admin') {
    const tracking = loadTracking();
    const candidates = loadCandidates();
    const { characters } = readJson(RANKINGS_FILE);
    const guildMap = buildGuildMap(characters);

    const pendingIdx = candidates.pending.findIndex(p => p.id === pendingId);
    if (pendingIdx === -1) throw new Error('대기 항목을 찾을 수 없습니다');

    const pending = candidates.pending[pendingIdx];
    const confirmed = pending.candidates[candidateIndex];
    if (!confirmed) throw new Error('유효하지 않은 후보 인덱스');

    const trackedGuild = tracking.guilds.find(g => g.id === pending.trackedGuildId);
    if (!trackedGuild) throw new Error('추적 결사를 찾을 수 없습니다');

    const lastHistory = trackedGuild.history[trackedGuild.history.length - 1];
    lastHistory.activeTo = new Date().toISOString();

    const newKey = `${confirmed.guildName}|${confirmed.world}`;
    const newGuildData = guildMap[newKey];

    trackedGuild.history.push({
        guildName: confirmed.guildName,
        world: confirmed.world,
        members: newGuildData ? newGuildData.members : [],
        memberCount: newGuildData ? newGuildData.members.length : 0,
        activeFrom: new Date().toISOString(),
        activeTo: null,
        confirmedBy,
        migratedFrom: { guildName: pending.originalGuildName, world: pending.originalWorld }
    });

    trackedGuild.status = 'active';
    trackedGuild.displayName = `${confirmed.guildName} (${confirmed.world})`;

    const [resolved] = candidates.pending.splice(pendingIdx, 1);
    resolved.resolvedAt = new Date().toISOString();
    resolved.resolvedBy = confirmedBy;
    resolved.confirmedIndex = candidateIndex;
    candidates.resolved.push(resolved);

    writeJson(TRACKING_FILE, tracking);
    writeJson(CANDIDATES_FILE, candidates);
    return trackedGuild;
}

function dismissMigration(pendingId, dismissedBy = 'admin') {
    const candidates = loadCandidates();
    const idx = candidates.pending.findIndex(p => p.id === pendingId);
    if (idx === -1) throw new Error('대기 항목을 찾을 수 없습니다');

    const [resolved] = candidates.pending.splice(idx, 1);
    resolved.resolvedAt = new Date().toISOString();
    resolved.resolvedBy = dismissedBy;
    resolved.dismissed = true;
    candidates.resolved.push(resolved);

    writeJson(CANDIDATES_FILE, candidates);
}

function getTrackedGuilds() {
    return loadTracking().guilds;
}

function getPendingMigrations() {
    return loadCandidates().pending;
}

function getGuildHistory(guildId) {
    const tracking = loadTracking();
    const guild = tracking.guilds.find(g => g.id === guildId);
    if (!guild) throw new Error('추적 결사를 찾을 수 없습니다');
    return guild;
}

module.exports = {
    addTrackedGuild,
    removeTrackedGuild,
    runDetection,
    syncMembers,
    confirmMigration,
    dismissMigration,
    getTrackedGuilds,
    getPendingMigrations,
    getGuildHistory
};
