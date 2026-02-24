export type Position = 'Goalkeeper' | 'Line';


export interface PlayerStats {
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
}

export interface Player {
    id: string;
    name: string;
    photo_url?: string;
    position: Position;
    level: number; // 1 to 5
    stats: PlayerStats;
    attributes?: { // For Radar Chart
        attack: number;
        defense: number;
        pace: number;
        shooting: number;
        physical: number;
        passing: number;
    };
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
    id: string;
    date: string; // ISO Date string
    team_a_score: number | null;
    team_b_score: number | null;
    team_a_players: string[]; // Array of player IDs
    team_b_players: string[]; // Array of player IDs
    status: MatchStatus;
    season_id?: string | null;
    seasons?: { name: string } | null;
}

// Live Match Tracking Types
export type EventType = 'Goal' | 'Assist' | 'YellowCard' | 'RedCard' | 'Foul' | 'OwnGoal';

export interface MatchEvent {
    id: string;
    type: EventType;
    team: 'A' | 'B';
    playerId: string;
    assistId?: string; // Optional assist
    timestamp: string; // Could be ISO or relative game time
}

export interface LiveMatchState {
    id?: string; // Supabase UUID
    isActive: boolean;
    startTime: string | null;
    totalElapsedTime: number; // Accumulated time in ms
    teamAScore: number;
    teamBScore: number;
    events: MatchEvent[];
}
