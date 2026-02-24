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

    const shuffledGKs = [...goalkeepers].sort(() => Math.random() - 0.5);

    if (shuffledGKs.length > 0) teamA.push(shuffledGKs[0]);
    if (shuffledGKs.length > 1) teamB.push(shuffledGKs[1]);

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
