import type { Player } from '../types';

export interface Team {
    id: string;
    name: string;
    players: Player[];
    totalLevel: number;
}

export const generateTeams = (players: Player[], playersPerTeam: number = 5): { teams: Team[], bench: Player[] } => {
    // 1. Filter Goalkeepers and Line Players
    const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
    const linePlayers = players.filter(p => p.position === 'Line');

    // 2. Sort Line Players by Level (Descending) for fair distribution
    const sortedLinePlayers = [...linePlayers].sort((a, b) => b.level - a.level);

    // 3. Calculate possible number of teams
    // Based ONLY on line players, because we can always rotate GKs or play without them if short.
    // If you prefer to count GKs in the total 5 men per team limit, adjust here.
    const numTeams = Math.floor(sortedLinePlayers.length / playersPerTeam);

    // If not enough players for even 1 complete team, we still try to balance what we have into 2 teams
    // or just return 0 teams if strict. For now, let's gracefully fallback or strictly enforce:
    if (numTeams < 2) {
        // Fallback to legacy logic of splitting everyone in 2 small teams if there are fewer than 10 people
        const teamA: Player[] = [];
        const teamB: Player[] = [];

        const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);
        if (shuffledGKs.length > 0) teamA.push(shuffledGKs[0]);
        if (shuffledGKs.length > 1) teamB.push(shuffledGKs[1]);

        sortedLinePlayers.forEach((player, index) => {
            const cycleIndex = index % 4;
            if ([0, 3].includes(cycleIndex)) { // 0, 1, 1, 0 snake order
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

    // 4. Initialize N Teams
    const teams: Player[][] = Array.from({ length: numTeams }, () => []);

    // 5. Distribute GKs (up to numTeams GKs)
    const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);
    const assignedGks = shuffledGKs.slice(0, numTeams);
    const benchGks = shuffledGKs.slice(numTeams);

    assignedGks.forEach((gk, i) => {
        teams[i].push(gk);
    });

    // 6. Distribute Line Players via Snake Draft limited to (numTeams * playersPerTeam)
    const playersToDraft = numTeams * playersPerTeam;
    const draftedLinePlayers = sortedLinePlayers.slice(0, playersToDraft);
    const benchLinePlayers = sortedLinePlayers.slice(playersToDraft);

    draftedLinePlayers.forEach((player, index) => {
        // E.g., for 3 teams: 0, 1, 2, 2, 1, 0, 0, 1, 2...
        const cycleLength = numTeams * 2;
        const cyclePos = index % cycleLength;
        const teamIndex = cyclePos < numTeams ? cyclePos : (cycleLength - 1) - cyclePos;
        teams[teamIndex].push(player);
    });

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
