import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import type { ToastType } from '../contexts/ToastContext';
import { useStore } from '../store/useStore';

// ─── Event shape from Supabase ────────────────────────────────────────────

interface RealtimeMatchEvent {
    id: string;
    match_id: string;
    player_id: string | null;
    assist_id: string | null;
    type: 'Goal' | 'OwnGoal' | 'YellowCard' | 'RedCard';
    team: 'A' | 'B';
    timestamp: string;
}

const TYPE_META: Record<string, { toastType: ToastType; emoji: string; label: string }> = {
    Goal: { toastType: 'goal', emoji: '⚽', label: 'GOL!' },
    OwnGoal: { toastType: 'owngoal', emoji: '↩️', label: 'GOL CONTRA!' },
    YellowCard: { toastType: 'yellow', emoji: '🟡', label: 'Cartão Amarelo' },
    RedCard: { toastType: 'red', emoji: '🔴', label: 'Cartão Vermelho' },
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useRealtime = () => {
    const { addToast } = useToast();
    const { players } = useStore();

    useEffect(() => {
        const channel = supabase
            .channel('jpffs-match-events')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'match_events' },
                (payload) => {
                    const ev = payload.new as RealtimeMatchEvent;
                    const meta = TYPE_META[ev.type] ?? TYPE_META.Goal;

                    const playerName = ev.player_id
                        ? players.find(p => p.id === ev.player_id)?.name ?? 'Desconhecido'
                        : null;
                    const assistName = ev.assist_id
                        ? players.find(p => p.id === ev.assist_id)?.name
                        : null;

                    const title = `${meta.emoji}  ${meta.label}${playerName ? `  —  ${playerName.split(' ')[0]}` : ''}`;
                    const subtitle = assistName ? `Assistência: ${assistName.split(' ')[0]}` : undefined;

                    addToast({
                        type: meta.toastType,
                        title,
                        subtitle,
                        team: ev.team,
                    });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [players, addToast]);
};
