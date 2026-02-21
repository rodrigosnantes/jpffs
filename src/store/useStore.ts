import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Player, Match, LiveMatchState, MatchEvent } from '../types';

interface AppState {
    players: Player[];
    matches: Match[];
    generatedTeams: { teamA: Player[], teamB: Player[] } | null;

    // Live Match State
    currentMatch: LiveMatchState;

    // Actions
    fetchPlayers: () => Promise<void>;
    fetchMatches: () => Promise<void>;
    addPlayer: (player: Omit<Player, 'id' | 'stats' | 'attributes'>) => Promise<void>;
    updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    setGeneratedTeams: (teams: { teamA: Player[], teamB: Player[] }) => void;

    // Match Actions
    startMatch: () => void;
    pauseMatch: () => void;
    resumeMatch: () => void;
    endMatch: () => void;
    addEvent: (event: Omit<MatchEvent, 'id' | 'timestamp'>) => void;
    resetMatch: () => void;
}

export const useStore = create<AppState>((set, get) => ({
    players: [],
    matches: [],
    generatedTeams: null,

    currentMatch: {
        isActive: false,
        startTime: null,
        totalElapsedTime: 0,
        teamAScore: 0,
        teamBScore: 0,
        events: []
    },

    fetchPlayers: async () => {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching players:', error);
            return;
        }

        set({ players: data as Player[] });
    },

    fetchMatches: async () => {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching matches:', error);
            return;
        }

        set({ matches: data as Match[] });
    },

    addPlayer: async (playerData) => {
        const newPlayer = {
            name: playerData.name,
            position: playerData.position,
            level: playerData.level,
            stats: {
                goals: 0, assists: 0, wins: 0, draws: 0, losses: 0,
                matches_played: 0, yellow_cards: 0, red_cards: 0
            },
            attributes: {
                attack: 50, defense: 50, pace: 50,
                shooting: 50, passing: 50, physical: 50
            }
        };

        const { data, error } = await supabase
            .from('players')
            .insert([newPlayer])
            .select()
            .single();

        if (error) {
            console.error('Error adding player:', error);
            return;
        }

        set((state) => ({ players: [...state.players, data as Player] }));
    },

    updatePlayer: async (id, updates) => {
        const { error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating player:', error);
            return;
        }

        set((state) => ({
            players: state.players.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
    },

    deletePlayer: async (id) => {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting player:', error);
            return;
        }

        set((state) => ({
            players: state.players.filter(p => p.id !== id)
        }));
    },

    setGeneratedTeams: (teams) => set({ generatedTeams: teams }),

    // Match Actions Implementation
    startMatch: async () => {
        const { generatedTeams } = get();
        if (!generatedTeams) return;

        const newMatch = {
            date: new Date().toISOString(),
            status: 'live',
            team_a_score: 0,
            team_b_score: 0,
            team_a_players: generatedTeams.teamA.map(p => p.id),
            team_b_players: generatedTeams.teamB.map(p => p.id),
            duration: 600
        };

        const { data, error } = await supabase
            .from('matches')
            .insert([newMatch])
            .select()
            .single();

        if (error) {
            console.error('Error starting match:', error);
            return;
        }

        set((state) => ({
            currentMatch: {
                ...state.currentMatch,
                id: data.id, // Store Supabase ID
                isActive: true,
                startTime: new Date().toISOString(),
                totalElapsedTime: 0,
                teamAScore: 0,
                teamBScore: 0,
                events: []
            },
            matches: [data as Match, ...state.matches] // Optimistic update or reload?
        }));
    },

    pauseMatch: () => set((state) => {
        if (!state.currentMatch.startTime) return {};
        const now = new Date().getTime();
        const start = new Date(state.currentMatch.startTime).getTime();
        const elapsed = now - start;

        return {
            currentMatch: {
                ...state.currentMatch,
                isActive: false,
                startTime: null,
                totalElapsedTime: state.currentMatch.totalElapsedTime + elapsed
            }
        };
    }),

    resumeMatch: () => set((state) => ({
        currentMatch: {
            ...state.currentMatch,
            isActive: true,
            startTime: new Date().toISOString()
        }
    })),

    endMatch: async () => {
        const state = get();
        const { teamAScore, teamBScore, events, id } = state.currentMatch;
        const generatedTeams = state.generatedTeams;

        if (!generatedTeams || !id) return;

        // 1. Update Match in DB
        const { error: matchError } = await supabase
            .from('matches')
            .update({
                status: 'finished',
                team_a_score: teamAScore,
                team_b_score: teamBScore,
                end_time: new Date().toISOString()
            })
            .eq('id', id);

        if (matchError) console.error('Error ending match:', matchError);

        // 2. Determine Match Result
        const teamAWin = teamAScore > teamBScore;
        const teamBWin = teamBScore > teamAScore;
        // const isDraw = teamAScore === teamBScore;

        // 3. Update Players Stats (Batch)
        // This is complex to do efficiently with single RLS calls, 
        // ideally implemented as a specialized RPC function in Supabase.
        // For MVP, we will fetch, calculate, and update one by one or leave it for "Realtime" to handle?
        // Let's keep the client-side logic for now but update DB.

        const allPlayers = [...generatedTeams.teamA, ...generatedTeams.teamB];

        for (const player of allPlayers) {
            const inTeamA = generatedTeams.teamA.some(p => p.id === player.id);
            const inTeamB = generatedTeams.teamB.some(p => p.id === player.id);

            // Calculate new stats
            const playerEvents = events.filter(e => e.playerId === player.id);
            const goals = playerEvents.filter(e => e.type === 'Goal').length;
            const assists = events.filter(e => e.assistId === player.id).length;
            const yellow_cards = playerEvents.filter(e => e.type === 'YellowCard').length;
            const red_cards = playerEvents.filter(e => e.type === 'RedCard').length;

            const currentStats = player.stats;
            const newStats = {
                ...currentStats,
                matches_played: currentStats.matches_played + 1,
                goals: currentStats.goals + goals,
                assists: currentStats.assists + assists,
                yellow_cards: currentStats.yellow_cards + yellow_cards,
                red_cards: currentStats.red_cards + red_cards,
            };

            if (inTeamA) {
                if (teamAWin) newStats.wins++;
                else if (teamBWin) newStats.losses++;
                else newStats.draws++;
            } else if (inTeamB) {
                if (teamBWin) newStats.wins++;
                else if (teamAWin) newStats.losses++;
                else newStats.draws++;
            }

            // Update in DB
            await supabase.from('players').update({ stats: newStats }).eq('id', player.id);
        }

        // 4. Reset Local State
        set((state) => ({
            currentMatch: {
                ...state.currentMatch,
                isActive: false,
                startTime: null,
                totalElapsedTime: 0,
                teamAScore: 0,
                teamBScore: 0,
                events: []
            }
        }));

        // Refresh local player list
        get().fetchPlayers();
    },

    addEvent: async (eventData) => {
        const state = get();
        const matchId = state.currentMatch.id;

        if (!matchId) return;

        const { error } = await supabase
            .from('match_events')
            .insert([{
                match_id: matchId,
                player_id: eventData.playerId,
                type: eventData.type,
                timestamp: new Date().toISOString(),
                assist_id: eventData.assistId,
                team: eventData.team
            }]);

        if (error) console.error('Error adding event:', error);

        // Optimistic Update
        const newEvent: MatchEvent = {
            id: crypto.randomUUID(), // Temp ID
            timestamp: new Date().toISOString(),
            ...eventData
        };

        let { teamAScore, teamBScore } = state.currentMatch;

        if (eventData.type === 'Goal') {
            if (eventData.team === 'A') teamAScore++;
            else teamBScore++;
        } else if (eventData.type === 'OwnGoal') {
            if (eventData.team === 'A') teamBScore++;
            else teamAScore++;
        }

        // Also update match score in DB
        if (eventData.type === 'Goal' || eventData.type === 'OwnGoal') {
            await supabase
                .from('matches')
                .update({
                    team_a_score: teamAScore,
                    team_b_score: teamBScore,
                })
                .eq('id', matchId);
        }

        set((state) => ({
            currentMatch: {
                ...state.currentMatch,
                teamAScore,
                teamBScore,
                events: [newEvent, ...state.currentMatch.events]
            }
        }));
    },

    resetMatch: () => set({
        currentMatch: {
            isActive: false,
            startTime: null,
            totalElapsedTime: 0,
            teamAScore: 0,
            teamBScore: 0,
            events: []
        }
    })

}));
