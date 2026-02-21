import React from 'react';
import type { Player } from '../../types';
import { Card } from './Card';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { Trophy, Activity, Target, Shield, Zap, Footprints } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PlayerProfileProps {
    player: Player;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
    const data = [
        { subject: 'Ataque', A: player.attributes?.attack || 50, fullMark: 100 },
        { subject: 'Defesa', A: player.attributes?.defense || 50, fullMark: 100 },
        { subject: 'Passe', A: player.attributes?.passing || 50, fullMark: 100 },
        { subject: 'Físico', A: player.attributes?.physical || 50, fullMark: 100 },
        { subject: 'Velocidade', A: player.attributes?.pace || 50, fullMark: 100 },
        { subject: 'Chute', A: player.attributes?.shooting || 50, fullMark: 100 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bio / Main Card */}
            <Card className="col-span-1 border-primary/20 bg-gradient-to-br from-surface to-surface/50">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20 mb-4">
                        {player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h2 className="text-3xl font-header font-bold text-white">{player.name}</h2>
                    <div className="flex items-center gap-2 mt-2 text-gray-400">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-sm font-bold",
                            player.position === 'Goalkeeper' ? "bg-yellow-500/20 text-yellow-500" : "bg-blue-400/20 text-blue-400"
                        )}>
                            {player.position === 'Goalkeeper' ? 'Goleiro' : 'Linha'}
                        </span>
                        <span className="text-sm">•</span>
                        <span className="text-sm">Nível {player.level}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full mt-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{player.stats.matches_played}</div>
                            <div className="text-xs text-gray-400 uppercase">Jogos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{player.stats.goals}</div>
                            <div className="text-xs text-gray-400 uppercase">Gols</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-500">{player.stats.wins}</div>
                            <div className="text-xs text-gray-400 uppercase">Vitórias</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Radar Chart */}
            <Card className="col-span-1 lg:col-span-2 flex flex-col justify-center">
                <h3 className="text-lg font-bold font-header flex items-center gap-2 mb-4">
                    <Activity className="text-primary" />
                    Atributos
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name={player.name}
                                dataKey="A"
                                stroke="#FFD700"
                                strokeWidth={3}
                                fill="#FFD700"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Detailed Stats */}
            <Card className="col-span-1 lg:col-span-3">
                <h3 className="text-lg font-bold font-header flex items-center gap-2 mb-6">
                    <Trophy className="text-primary" />
                    Estatísticas da Temporada
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full text-green-500"><Target size={20} /></div>
                        <div>
                            <div className="text-2xl font-bold">{player.stats.goals}</div>
                            <div className="text-sm text-gray-400">Gols</div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full text-blue-500"><Footprints size={20} /></div>
                        <div>
                            <div className="text-2xl font-bold">{player.stats.assists}</div>
                            <div className="text-sm text-gray-400">Assistências</div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500"><Shield size={20} /></div>
                        <div>
                            <div className="text-2xl font-bold">{player.stats.matches_played}</div>
                            <div className="text-sm text-gray-400">Partidas</div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-full text-purple-500"><Zap size={20} /></div>
                        <div>
                            <div className="text-2xl font-bold">{parseInt(String((player.stats.wins / player.stats.matches_played || 0) * 100))}%</div>
                            <div className="text-sm text-gray-400">Aproveitamento</div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
