import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, Trophy, Play, ArrowRight, Activity, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';

export const Dashboard = () => {
    const { players, matches, currentMatch } = useStore();

    const lastMatch = matches.length > 0 ? matches[0] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/5 p-8 md:p-12">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-header font-bold text-white mb-4">
                        JPFFS <span className="text-primary">Manager</span>
                    </h1>
                    <p className="text-gray-300 text-lg max-w-xl mb-8">
                        Gerencie suas peladas, acompanhe estatísticas em tempo real e descubra quem são os verdadeiros craques da galera.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/teams">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-background font-bold shadow-lg shadow-primary/25">
                                <Play className="mr-2" size={20} /> Iniciar Nova Partida
                            </Button>
                        </Link>
                        <Link to="/players">
                            <Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/10">
                                <Users className="mr-2" size={20} /> Gerenciar Jogadores
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 p-6 hover:border-primary/30 transition-colors group">
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Jogadores Cadastrados</p>
                        <p className="text-3xl font-bold text-white">{players.length}</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4 p-6 hover:border-primary/30 transition-colors group">
                    <div className="p-4 bg-green-500/10 rounded-2xl text-green-400 group-hover:scale-110 transition-transform">
                        <Activity size={32} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Partidas Realizadas</p>
                        <p className="text-3xl font-bold text-white">{matches.length}</p>
                    </div>
                </Card>

                <Link to="/leaderboard" className="block">
                    <Card className="flex items-center gap-4 p-6 hover:border-primary/50 transition-colors group bg-gradient-to-br from-surface to-primary/5 cursor-pointer h-full border-primary/20">
                        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                            <Trophy size={32} />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Classificação Geral</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold text-primary">Ver Ranking</p>
                                <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Recent Activity / Active Match */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Match Card */}
                {currentMatch.isActive ? (
                    <Card className="border-green-500/30 bg-green-500/5 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Partida em Andamento
                                </h3>
                                <p className="text-green-400 text-sm mt-1">Acompanhe agora</p>
                            </div>
                            <Link to="/teams">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                    Ir para o Jogo
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center justify-between px-4 py-8 bg-black/20 rounded-2xl">
                            <div className="text-center">
                                <span className="text-yellow-500 font-bold text-lg block">Time A</span>
                                <span className="text-4xl font-bold text-white">{currentMatch.teamAScore}</span>
                            </div>
                            <div className="text-gray-500 font-mono text-xl">vs</div>
                            <div className="text-center">
                                <span className="text-blue-500 font-bold text-lg block">Time B</span>
                                <span className="text-4xl font-bold text-white">{currentMatch.teamBScore}</span>
                            </div>
                        </div>
                    </Card>
                ) : (
                    // Last Match Result
                    <Card className="flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold font-header text-white flex items-center gap-2">
                                <Calendar className="text-gray-400" size={20} />
                                Última Partida
                            </h3>
                            {lastMatch && (
                                <span className="text-xs text-gray-500 font-mono border border-white/10 px-2 py-1 rounded">
                                    {new Date(lastMatch.date).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {lastMatch ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between px-6 py-8 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-center">
                                        <span className="text-yellow-500 font-bold text-lg block mb-1">Time A</span>
                                        <span className={cn("text-4xl font-bold", lastMatch.team_a_score! > lastMatch.team_b_score! ? "text-green-400" : "text-white")}>
                                            {lastMatch.team_a_score}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-gray-500 text-sm font-bold uppercase">Final</span>
                                        <span className="text-gray-600 font-mono text-xl">-</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-blue-500 font-bold text-lg block mb-1">Time B</span>
                                        <span className={cn("text-4xl font-bold", lastMatch.team_b_score! > lastMatch.team_a_score! ? "text-green-400" : "text-white")}>
                                            {lastMatch.team_b_score}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
                                <p>Nenhuma partida realizada ainda.</p>
                                <Link to="/teams" className="mt-4 text-primary hover:underline text-sm">
                                    Começar a primeira partida
                                </Link>
                            </div>
                        )}
                    </Card>
                )}

                {/* Quick Leaderboard Preview */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold font-header text-white flex items-center gap-2">
                            <Trophy className="text-amber-500" size={20} />
                            Top 5 Goleadores
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {players
                            .sort((a, b) => b.stats.goals - a.stats.goals)
                            .slice(0, 5)
                            .map((player, index) => (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                            index === 0 ? "bg-yellow-500 text-black" :
                                                index === 1 ? "bg-gray-400 text-black" :
                                                    index === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-gray-400"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-white">{player.name}</span>
                                    </div>
                                    <span className="font-bold text-primary">{player.stats.goals} Gols</span>
                                </div>
                            ))
                        }
                    </div>
                </Card>
            </div>
        </div>
    );
};
