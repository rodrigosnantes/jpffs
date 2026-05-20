import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Maximize2, Trophy } from 'lucide-react';
import { cn } from '../../utils/cn';

export const MatchOverlay = () => {
    const { currentMatch, pauseMatch, resumeMatch } = useStore();
    const { timeDisplay } = useMatchTimer(currentMatch);
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show if no match is active or if we are already on the teams page
    const isMatchLive = currentMatch.id && (currentMatch.isActive || currentMatch.totalElapsedTime > 0);
    const isTeamsPage = location.pathname === '/teams';

    if (!isMatchLive || isTeamsPage) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
            >
                <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex items-center p-1 font-header">
                    {/* Timer Section */}
                    <div className={cn(
                        "flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-colors",
                        currentMatch.isActive ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-500"
                    )}>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                            {currentMatch.isActive ? 'Live' : 'Paused'}
                        </span>
                        <span className="text-xl font-mono font-bold leading-none">
                            {timeDisplay}
                        </span>
                    </div>

                    {/* Score Section */}
                    <div className="flex-1 flex items-center justify-around px-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-yellow-500 font-bold uppercase mb-1">Time A</span>
                            <span className="text-2xl font-black">{currentMatch.teamAScore}</span>
                        </div>
                        
                        <div className="flex flex-col items-center opacity-30">
                            <Trophy size={14} />
                            <span className="text-[10px] font-bold">VS</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-blue-500 font-bold uppercase mb-1">Time B</span>
                            <span className="text-2xl font-black">{currentMatch.teamBScore}</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 pr-1">
                        <button
                            onClick={() => currentMatch.isActive ? pauseMatch() : resumeMatch()}
                            className={cn(
                                "p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95",
                                currentMatch.isActive 
                                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" 
                                    : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                            )}
                            title={currentMatch.isActive ? 'Pausar' : 'Retomar'}
                        >
                            {currentMatch.isActive ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>

                        <button
                            onClick={() => navigate('/teams')}
                            className="p-2.5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                            title="Ver Detalhes / Gerenciar"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Aesthetic decorative line */}
                <motion.div 
                    className="h-0.5 bg-primary/40 mx-auto rounded-full mt-1 px-4"
                    animate={{ 
                        width: currentMatch.isActive ? ["20%", "60%", "20%"] : "20%",
                        opacity: currentMatch.isActive ? [0.4, 0.8, 0.4] : 0.4
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>
        </AnimatePresence>
    );
};
