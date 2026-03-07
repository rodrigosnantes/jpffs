import type { Player } from '../types';

export interface Team {
    id: string;
    name: string;
    players: Player[];
    totalLevel: number;
}

export interface TeamGenerationConfig {
    playersPerTeam: number;
}

export const generateTeams = (
    players: Player[],
    config: TeamGenerationConfig = { playersPerTeam: 5 }
): { teams: Team[], bench: Player[] } => {

    const { playersPerTeam } = config;

    // 1. Separate Goalkeepers and Line Players
    const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
    const linePlayers = players.filter(p => p.position === 'Line');

    // 2. Sort Line Players by Level (Descending)
    const sortedLinePlayers = [...linePlayers].sort((a, b) => b.level - a.level);

    // 3. Calculate max possible teams
    const totalPlayers = players.length;
    const numTeams = Math.floor(totalPlayers / playersPerTeam);

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

        const calculateTotalLevel = (t: Player[]) => t.reduce((sum, p) => sum + p.level, 0);

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

    assignedGks.forEach((gk, i) => {
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

    const calculateTotalLevel = (t: Player[]) => t.reduce((sum, p) => sum + p.level, 0);

    const generatedTeams: Team[] = teams.map((teamPlayers, index) => ({
        id: (index + 1).toString(),
        name: `Time ${index + 1}`,
        players: teamPlayers,
        totalLevel: calculateTotalLevel(teamPlayers)
    }));

    return {
        teams: generatedTeams,
        bench: [...benchGks, ...benchLinePlayers]
    };
};
