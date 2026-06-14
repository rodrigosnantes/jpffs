import type { Player } from '../types';

export interface Team {
    id: string;
    name: string;
    players: Player[];
    totalLevel: number;
}

export interface TeamGenerationConfig {
    playersPerTeam: number;
    random?: boolean;
    fillGenericGks?: boolean;
    redistributeBench?: boolean;
}

export interface TeamGenerationResult {
    teams: Team[];
    bench: Player[];
    benchTeams?: Team[];
}

export const generateTeams = (
    players: Player[],
    config: TeamGenerationConfig = { playersPerTeam: 5 }
): TeamGenerationResult => {

    const { playersPerTeam, random = false, fillGenericGks = true } = config;

    // 1. Separate Goalkeepers and Line Players
    const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
    const linePlayers = players.filter(p => p.position === 'Line');

    // 2. Sort Line Players by Level (Descending), randomize within same level
    const sortedLinePlayers = [...linePlayers].sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return Math.random() - 0.5; // randomize players of equal level
    });

    // 3. Calculate max possible teams
    const totalPlayers = players.length;
    const numTeams = Math.floor(totalPlayers / playersPerTeam);

    const calculateTotalLevel = (t: Player[]) => t.reduce((sum, p) => sum + p.level, 0);

    // --- RANDOM MODE BYPASS ---
    if (random) {
        // Shuffle ALL players completely, ignoring positions and levels
        const shuffledAll = [...players].sort(() => Math.random() - 0.5);

        const teams: Player[][] = Array.from({ length: numTeams }, () => []);
        const totalToDraft = numTeams * playersPerTeam;

        const draftedPlayers = shuffledAll.slice(0, totalToDraft);
        const benchPlayers = shuffledAll.slice(totalToDraft);

        draftedPlayers.forEach((player, index) => {
            const teamIndex = Math.floor(index / playersPerTeam);
            teams[teamIndex].push(player);
        });

        const generatedTeams: Team[] = teams.map((teamPlayers, index) => ({
            id: (index + 1).toString(),
            name: `Time ${index + 1}`,
            players: teamPlayers,
            totalLevel: calculateTotalLevel(teamPlayers)
        }));

        return applyBenchRedistribution({
            teams: generatedTeams,
            bench: benchPlayers
        }, config);
    }
    // --- END RANDOM MODE ---

    if (numTeams < 2) {
        // Fallback for very small groups: Attempt 2 bare-minimum teams
        const teamA: Player[] = [];
        const teamB: Player[] = [];

        const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);
        if (shuffledGKs.length > 0) teamA.push(shuffledGKs[0]);
        if (shuffledGKs.length > 1) teamB.push(shuffledGKs[1]);

        sortedLinePlayers.forEach((player, index) => {
            const cycleIndex = index % 4;
            if ([0, 3].includes(cycleIndex)) {
                teamA.push(player);
            } else {
                teamB.push(player);
            }
        });

        return {
            teams: [
                { id: '1', name: 'Time 1', players: teamA, totalLevel: calculateTotalLevel(teamA) },
                { id: '2', name: 'Time 2', players: teamB, totalLevel: calculateTotalLevel(teamB) }
            ],
            bench: []
        };
    }

    // 4. Initialize valid Teams
    const teams: Player[][] = Array.from({ length: numTeams }, () => []);

    // 5. Shuffle and distribute Goalkeepers (Max 1 per team)
    const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);
    const assignedGks = shuffledGKs.slice(0, numTeams);
    const benchGks = shuffledGKs.slice(numTeams);

    if (!random && fillGenericGks && assignedGks.length < numTeams) {
        const neededGks = numTeams - assignedGks.length;
        for (let i = 0; i < neededGks; i++) {
            assignedGks.push({
                id: `generic-gk-${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
                name: 'Goleiro Genérico',
                position: 'Goalkeeper',
                level: 3,
                stats: {
                    goals: 0, assists: 0, wins: 0, draws: 0, losses: 0,
                    matches_played: 0, yellow_cards: 0, red_cards: 0
                },
                attributes: {
                    attack: 50, defense: 50, pace: 50,
                    shooting: 50, passing: 50, physical: 50
                }
            });
        }
    }

    // Shuffle all GKs (real + generic) so generic ones can land on any team
    const finalGks = [...assignedGks].sort(() => Math.random() - 0.5);

    finalGks.forEach((gk, i) => {
        teams[i].push(gk);
    });

    // 6. Calculate exactly how many line players are needed to fill holes
    // Every team needs exactly `playersPerTeam` total players.
    // If a team didn't receive a GK, it needs `playersPerTeam` line players.
    // If it did, it needs `playersPerTeam - 1` line players.
    const getTeamDeficit = (teamIndex: number) => playersPerTeam - teams[teamIndex].length;

    let linePlayerIndex = 0;
    const maxLinePlayers = sortedLinePlayers.length;

    // Distribute Line Players using Snake Draft
    // We do rounds until all teams are full or we run out of line players
    let isReversed = false;
    let keepDrafting = true;

    while (keepDrafting) {
        keepDrafting = false;

        // Determine the order for this round
        const order = Array.from({ length: numTeams }, (_, i) => i);
        if (isReversed) order.reverse();

        for (const teamIndex of order) {
            if (getTeamDeficit(teamIndex) > 0 && linePlayerIndex < maxLinePlayers) {
                teams[teamIndex].push(sortedLinePlayers[linePlayerIndex]);
                linePlayerIndex++;
                keepDrafting = true; // successfully drafted someone, might need another round
            }
        }

        // Toggle direction for Snake Draft
        isReversed = !isReversed;
    }

    // 7. Collect Bench (Line players that didn't fit into the exact capacities)
    const benchLinePlayers = sortedLinePlayers.slice(linePlayerIndex);

    const generatedTeams: Team[] = teams.map((teamPlayers, index) => ({
        id: (index + 1).toString(),
        name: `Time ${index + 1}`,
        players: teamPlayers,
        totalLevel: calculateTotalLevel(teamPlayers)
    }));

    return applyBenchRedistribution({
        teams: generatedTeams,
        bench: [...benchGks, ...benchLinePlayers]
    }, config);
};

// ─── Helper: redistribute bench into 2 sub-teams ─────────────────────────

export function applyBenchRedistribution(
    result: { teams: Team[]; bench: Player[]; benchTeams?: Team[] },
    config: TeamGenerationConfig
): TeamGenerationResult {
    const { redistributeBench = false, random = false } = config;

    if (!redistributeBench || result.bench.length < 2) {
        return {
            ...result,
            benchTeams: result.benchTeams || []
        };
    }

    const { teams, bench, benchTeams = [] } = result;

    // Sort bench by level (randomize within same level) or fully random
    const sortedBench = random
        ? [...bench].sort(() => Math.random() - 0.5)
        : [...bench].sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return Math.random() - 0.5;
        });

    // Snake draft into 2 sub-teams
    const groupA: Player[] = [];
    const groupB: Player[] = [];
    sortedBench.forEach((p, i) => {
        const cycle = i % 4;
        if (cycle === 0 || cycle === 3) groupA.push(p);
        else groupB.push(p);
    });

    const nextNum = teams.length + benchTeams.length + 1;
    const calcLevel = (ps: Player[]) => ps.reduce((s, p) => s + p.level, 0);

    return {
        teams,
        bench: [],
        benchTeams: [
            ...benchTeams,
            { id: `bench-team-${Date.now()}-1`, name: `Time ${nextNum}`, players: groupA, totalLevel: calcLevel(groupA) },
            { id: `bench-team-${Date.now()}-2`, name: `Time ${nextNum + 1}`, players: groupB, totalLevel: calcLevel(groupB) },
        ].filter(t => t.players.length > 0),
    };
}
