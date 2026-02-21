import type { Player } from '../types';

interface Team {
    name: string;
    players: Player[];
    totalLevel: number;
}

export const generateTeams = (players: Player[]): [Team, Team] => {
    // 1. Filter Goalkeepers and Line Players
    const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
    const linePlayers = players.filter(p => p.position === 'Line');

    // 2. Sort Line Players by Level (Descending)
    const sortedLinePlayers = [...linePlayers].sort((a, b) => b.level - a.level);

    // 3. Initialize Teams
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // 4. Assign Goalkeepers (Randomly if more than 2, or just distribute)
    // Shuffle goalkeepers for randomness
    const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);

    if (shuffledGKs.length > 0) teamA.push(shuffledGKs[0]);
    if (shuffledGKs.length > 1) teamB.push(shuffledGKs[1]);
    // Handle extra GKs if necessary, or assume max 2 selected for now.
    // Requirement says "Randomly assign 1 GK to Team A and 1 to Team B".
    // If more GKs are selected, they might be treated as line players or just added. 
    // For MVP, let's assume valid input (2 GKs selected).

    // 5. Snake Draft Distribution for Line Players
    // Pattern: A, B, B, A, A, B...

    // However, standard snake after GKs:
    // If GKs are balanced, start with A.

    // Refined Snake Draft to balance levels:
    // We can just iterate and assign to the team with the lower total level, 
    // or strictly follow A, B, B, A.
    // Strict Snake:
    // Index 0 -> A
    // Index 1 -> B
    // Index 2 -> B
    // Index 3 -> A
    // Index 4 -> A
    // Index 5 -> B

    sortedLinePlayers.forEach((player, index) => {
        const snakeOrder = [0, 1, 1, 0]; // 4-step cycle
        const cycleIndex = index % 4;

        if (snakeOrder[cycleIndex] === 0) {
            teamA.push(player);
        } else {
            teamB.push(player);
        }
    });

    const calculateTotalLevel = (team: Player[]) => team.reduce((sum, p) => sum + p.level, 0);

    return [
        { name: 'Time Amarelo', players: teamA, totalLevel: calculateTotalLevel(teamA) },
        { name: 'Time Azul', players: teamB, totalLevel: calculateTotalLevel(teamB) }
    ];
};
