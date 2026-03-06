import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Player, Match, LiveMatchState, MatchEvent } from '../types';
import type { Team } from '../utils/teamSorter';

interface AppState {
    players: Player[];
    matches: Match[];
    generatedTeams: { teams: Team[], bench: Player[] } | null;
    lastMVP: { id: string; name: string; goals: number; assists: number; team: 'A' | 'B' } | null;

    // Live Match State
    currentMatch: LiveMatchState & { teamAId?: string; teamBId?: string; teamAPlayers?: Player[]; teamBPlayers?: Player[] };

    // UI State
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;

    // Actions
    fetchPlayers: () => Promise<void>;
    fetchMatches: () => Promise<void>;
    addPlayer: (player: Omit<Player, 'id' | 'stats' | 'attributes'>) => Promise<void>;
    updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    setGeneratedTeams: (teamsData: { teams: Team[], bench: Player[] } | null) => void;

    // Match Actions
    startMatch: (teamAInfo: Team, teamBInfo: Team) => Promise<{ error?: string }>;
    pauseMatch: () => void;
    resumeMatch: () => void;
    endMatch: () => void;
    addEvent: (event: Omit<MatchEvent, 'id' | 'timestamp'>) => void;
    resetMatch: () => void;
    clearMVP: () => void;
}

export const useStore = create<AppState>((set, get) => ({
    players: [],
    matches: [],
    generatedTeams: null,
    lastMVP: null,

    currentMatch: {
        isActive: false,
        startTime: null,
        totalElapsedTime: 0,
        teamAScore: 0,
        teamBScore: 0,
        events: []
    },

    isSidebarOpen: true,
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    fetchPlayers: async () => {
        const { data, error } = await supabase
            .from('players')
            .select('*, profiles(nickname)')
            .order('name');

        if (error) {
            console.error('Error fetching players:', error);
            return;
        }

        const mappedData = data.map((p: any) => ({
            ...p,
            nickname: p.profiles?.nickname || null
        }));

        set({ players: mappedData as Player[] });
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
        // Fetch the profile_id to also delete from the profiles table
        const { data: player } = await supabase
            .from('players')
            .select('profile_id')
            .eq('id', id)
            .single();

        const profileId = player?.profile_id;

        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting player:', error);
            return;
        }

        // Delete the profile if a profile_id was associated with this player
        if (profileId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profileId);

            if (profileError) {
                console.error('Error deleting profile:', profileError);
            }
        }

        set((state) => ({
            players: state.players.filter(p => p.id !== id)
        }));
    },

    setGeneratedTeams: (teamsData) => set({ generatedTeams: teamsData }),

    // Match Actions Implementation
    startMatch: async (teamAInfo, teamBInfo) => {
        // Fetch active season (if any)
        const { data: seasonData } = await supabase
            .from('seasons')
            .select('id')
            .eq('is_active', true)
            .maybeSingle();

        if (!seasonData) {
            return { error: 'Não há uma Temporada ativa. Crie ou ative uma Temporada no painel de Temporadas antes de iniciar a partida.' };
        }

        // Helper to get local date in YYYY-MM-DD format
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        const newMatch = {
            date: localDate,
            status: 'live',
            team_a_score: 0,
            team_b_score: 0,
            team_a_players: teamAInfo.players.map(p => p.id),
            team_b_players: teamBInfo.players.map(p => p.id),
            duration: 600,
            season_id: seasonData?.id ?? null,
        };

        const { data, error } = await supabase
            .from('matches')
            .insert([newMatch])
            .select()
            .single();

        if (error) {
            console.error('Error starting match:', error);
            return { error: error.message };
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
                events: [],
                teamAId: teamAInfo.id,
                teamBId: teamBInfo.id,
                teamAPlayers: teamAInfo.players,
                teamBPlayers: teamBInfo.players
            },
            matches: [data as Match, ...state.matches] // Optimistic update or reload?
        }));

        return {};
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
        const { teamAScore, teamBScore, events, id, teamAPlayers, teamBPlayers } = state.currentMatch;
        const generatedTeams = state.generatedTeams;

        if (!generatedTeams || !id || !teamAPlayers || !teamBPlayers) return;

        // 1. Update Match in DB
        const { error: matchError } = await supabase
            .from('matches')
            .update({
                status: 'finished',
                team_a_score: teamAScore,
                team_b_score: teamBScore,
            })
            .eq('id', id);

        if (matchError) {
            console.error('Error ending match:', matchError);
            return;
        }

        const teamAWin = teamAScore > teamBScore;
        const teamBWin = teamBScore > teamAScore;

        const allPlayers = [...teamAPlayers, ...teamBPlayers];

        for (const player of allPlayers) {
            const inTeamA = teamAPlayers.some(p => p.id === player.id);
            const inTeamB = teamBPlayers.some(p => p.id === player.id);

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

        // ── Calculate MVP before reset ─────────────────────────────────────────
        const allForMVP = [...teamAPlayers, ...teamBPlayers];
        const mvpScores = allForMVP.map(p => {
            const goals = events.filter(e => e.playerId === p.id && e.type === 'Goal').length;
            const assists = events.filter(e => e.assistId === p.id).length;
            const team: 'A' | 'B' = teamAPlayers.some(t => t.id === p.id) ? 'A' : 'B';
            return { id: p.id, name: p.name, goals, assists, score: goals * 2 + assists, team };
        }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
        const mvp = mvpScores[0] ?? null;

        // 4. Reset Local State
        set((state) => ({
            lastMVP: mvp,
            currentMatch: {
                ...state.currentMatch,
                isActive: false,
                startTime: null,
                totalElapsedTime: 0,
                teamAScore: 0,
                teamBScore: 0,
                events: [],
                teamAId: undefined,
                teamBId: undefined,
                teamAPlayers: undefined,
                teamBPlayers: undefined
            }
        }));

        // Refresh local player and match lists
        get().fetchPlayers();
        get().fetchMatches();
    },

    clearMVP: () => set({ lastMVP: null }),

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
            events: [],
            teamAId: undefined,
            teamBId: undefined,
            teamAPlayers: undefined,
            teamBPlayers: undefined
        }
    })

}));
