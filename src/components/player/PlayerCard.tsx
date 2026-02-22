import React from 'react';
import type { Player } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    player: Player;
    winRate: number;
    cardRef: React.RefObject<HTMLDivElement | null>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Weighted overall rating (0-99) */
const calcOverall = (player: Player): number => {
    const a = player.attributes;
    if (!a) return 70;
    const avg = (a.attack + a.defense + a.pace + a.shooting + a.physical + a.passing) / 6;
    return Math.round(avg);
};

const attrColor = (v: number) =>
    v >= 80 ? '#4ade80' : v >= 60 ? '#facc15' : '#9ca3af';

// ─── Component ────────────────────────────────────────────────────────────────

export const PlayerCard = ({ player, winRate, cardRef }: Props) => {
    const isGoalie = player.position === 'Goalkeeper';
    const overall = calcOverall(player);
    const { stats, attributes } = player;

    // Colour theme
    const accent     = isGoalie ? '#f59e0b' : '#3b82f6';
    const accentDark = isGoalie ? '#78350f' : '#1e3a5f';
    const bg1        = isGoalie ? '#1c1408' : '#080e1a';
    const bg2        = isGoalie ? '#3d2008' : '#0a1628';

    const attrs = [
        { label: 'PAC', value: attributes?.pace     ?? 50 },
        { label: 'CHU', value: attributes?.shooting ?? 50 },
        { label: 'PAS', value: attributes?.passing  ?? 50 },
        { label: 'DEF', value: attributes?.defense  ?? 50 },
        { label: 'FÍS', value: attributes?.physical ?? 50 },
        { label: 'ATK', value: attributes?.attack   ?? 50 },
    ];

    // ─── Inline styles (html2canvas safe) ────────────────────────────────────

    const W = 300;
    const H = 420;

    const cardStyle: React.CSSProperties = {
        width: W,
        height: H,
        borderRadius: 20,
        background: `linear-gradient(145deg, ${bg1} 0%, ${bg2} 50%, ${accentDark} 100%)`,
        border: `1.5px solid ${accent}44`,
        boxShadow: `0 0 40px ${accent}22, inset 0 0 60px #00000060`,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px 20px',
        boxSizing: 'border-box',
    };

    // Decorative top-left gradient blob
    const blobStyle: React.CSSProperties = {
        position: 'absolute',
        top: -60,
        left: -60,
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
    };

    const ratingStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1,
        position: 'absolute',
        top: 20,
        left: 20,
    };

    const avatarStyle: React.CSSProperties = {
        width: 84,
        height: 84,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
        border: `2px solid ${accent}66`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        fontWeight: 900,
        color: accent,
        letterSpacing: -1,
        marginBottom: 10,
        flexShrink: 0,
    };

    const nameStyle: React.CSSProperties = {
        fontSize: 18,
        fontWeight: 900,
        color: '#ffffff',
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 4,
        textShadow: `0 0 20px ${accent}55`,
    };

    const posStyle: React.CSSProperties = {
        fontSize: 10,
        fontWeight: 700,
        color: accent,
        letterSpacing: 3,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 16,
        opacity: 0.85,
    };

    // Divider
    const dividerStyle: React.CSSProperties = {
        width: '80%',
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`,
        marginBottom: 14,
    };

    // 6-attr grid
    const attrGridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '6px 12px',
        width: '100%',
        marginBottom: 14,
    };

    const attrItemStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    };

    // Bottom stats strip
    const statsRowStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 0',
        borderTop: `1px solid ${accent}22`,
    };

    const statColStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    };

    // Watermark
    const watermarkStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 8,
        right: 12,
        fontSize: 8,
        color: `${accent}44`,
        letterSpacing: 2,
        fontWeight: 700,
        textTransform: 'uppercase',
    };

    const starsRow = Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < player.level ? accent : '#374151', fontSize: 10 }}>★</span>
    ));

    return (
        <div ref={cardRef} style={cardStyle}>
            <div style={blobStyle} />

            {/* Rating */}
            <div style={ratingStyle}>
                <span style={{ fontSize: 34, fontWeight: 900, color: accent, lineHeight: 1 }}>
                    {overall}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: `${accent}99`, letterSpacing: 1, marginTop: 2 }}>
                    {isGoalie ? 'GK' : 'LIN'}
                </span>
            </div>

            {/* Stars top-right */}
            <div style={{ position: 'absolute', top: 22, right: 18, display: 'flex', gap: 2 }}>
                {starsRow}
            </div>

            {/* Avatar */}
            <div style={{ marginTop: 10 }}>
                <div style={avatarStyle}>
                    {player.name.substring(0, 2).toUpperCase()}
                </div>
            </div>

            {/* Name */}
            <div style={nameStyle}>{player.name}</div>
            <div style={posStyle}>{isGoalie ? '🧤 Goleiro' : '👟 Linha'} · JPFFS</div>

            <div style={dividerStyle} />

            {/* 6 Attributes */}
            <div style={attrGridStyle}>
                {attrs.map(({ label, value }) => (
                    <div key={label} style={attrItemStyle}>
                        <span style={{
                            fontSize: 16, fontWeight: 800, fontFamily: 'monospace',
                            color: attrColor(value), minWidth: 26,
                        }}>
                            {value}
                        </span>
                        <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, letterSpacing: 1 }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Stats strip */}
            <div style={statsRowStyle}>
                {[
                    { label: '⚽', value: stats.goals },
                    { label: '🅰', value: stats.assists },
                    { label: '🏆', value: stats.matches_played },
                    { label: '%', value: `${winRate}` },
                ].map(({ label, value }) => (
                    <div key={label} style={statColStyle}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>{value}</span>
                        <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>{label}</span>
                    </div>
                ))}
            </div>

            <div style={watermarkStyle}>jpffs.app</div>
        </div>
    );
};
