import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  Shield,
  Users,
  RefreshCw,
  Trophy,
  UserPlus,
  X,
  Plus,
  Shuffle,
  Check,
  AlertTriangle,
} from "lucide-react";
import { generateTeams, type Team } from "../utils/teamSorter";
import type { Player } from "../types";
import { cn } from "../utils/cn";
import { MatchControlPanel } from "../components/match/MatchControlPanel";

export const Teams = () => {
  const {
    players,
    generatedTeams,
    setGeneratedTeams,
    currentMatch,
    attendanceIds,
    fetchAttendance,
  } = useStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // Sort Config
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
  const [isRandom, setIsRandom] = useState<boolean>(false);
  const [fillGenericGks, setFillGenericGks] = useState<boolean>(true);
  const [redistributeBench, setRedistributeBench] = useState<boolean>(true);

  // Selected teams for the match
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // ── Synchronize selectedTeamIds when generatedTeams changes ────────────
  useEffect(() => {
    if (!generatedTeams) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds((prev) =>
        prev.filter((id) => {
          const inTeams = generatedTeams.teams.some((t) => t.id === id);
          const inBenchTeams = generatedTeams.benchTeams?.some(
            (t) => t.id === id,
          );
          return inTeams || inBenchTeams;
        }),
      );
    }
  }, [generatedTeams]);

  // Manual Team State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTeamPlayers, setManualTeamPlayers] = useState<Player[]>([]);
  const [manualTeamGenerating, setManualTeamGenerating] = useState(false);
  const [editingBenchTeamIndex, setEditingBenchTeamIndex] = useState<
    number | null
  >(null);

  // Load today's confirmed players
  useEffect(() => {
    fetchAttendance().then(() => {
      // Auto-select all confirmed EXCEPT those currently playing
      const playingIds = new Set([
        ...(currentMatch.teamAPlayers?.map((p) => p.id) || []),
        ...(currentMatch.teamBPlayers?.map((p) => p.id) || []),
      ]);

      const availableIds = attendanceIds.filter(
        (id) => !currentMatch.isActive || !playingIds.has(id),
      );
      setSelectedPlayerIds(availableIds);
      setAttendanceLoaded(true);
    });
  }, [
    currentMatch.isActive,
    currentMatch.teamAPlayers,
    currentMatch.teamBPlayers,
    fetchAttendance,
    attendanceIds.length,
  ]);

  const isPlayerPlaying = (playerId: string) => {
    if (!currentMatch.id || !currentMatch.isActive) return false;
    const inA = currentMatch.teamAPlayers?.some((p: any) => p.id === playerId);
    const inB = currentMatch.teamBPlayers?.some((p: any) => p.id === playerId);
    return !!(inA || inB);
  };

  // Only show players confirmed in attendance
  const attendedPlayers = players.filter((p) => attendanceIds.includes(p.id));

  // ── Identify unallocated players ───────────────────────────────────────
  const getAllocatedPlayerIds = () => {
    if (!generatedTeams) return new Set<string>();
    const ids = new Set<string>();
    generatedTeams.teams.forEach((t) =>
      t.players.forEach((p) => ids.add(p.id)),
    );
    generatedTeams.bench.forEach((p) => ids.add(p.id));
    generatedTeams.benchTeams?.forEach((t) =>
      t.players.forEach((p) => ids.add(p.id)),
    );
    return ids;
  };

  const allocatedIds = getAllocatedPlayerIds();
  const unallocatedPlayers = attendedPlayers.filter(
    (p) => !allocatedIds.has(p.id),
  );

  const handleAddUnallocatedToBench = () => {
    if (!generatedTeams || unallocatedPlayers.length === 0) return;
    setGeneratedTeams({
      ...generatedTeams,
      bench: [...generatedTeams.bench, ...unallocatedPlayers],
    });
  };

  const handleTogglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((pid) => pid !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === attendedPlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(attendedPlayers.map((p) => p.id));
    }
  };

  const handleGenerateTeams = () => {
    const selectedPlayers = attendedPlayers.filter((p) =>
      selectedPlayerIds.includes(p.id),
    );
    if (selectedPlayers.length < 10) {
      alert("Selecione pelo menos 10 jogadores (2 times completos).");
      return;
    }
    const result = generateTeams(selectedPlayers, {
      playersPerTeam,
      random: isRandom,
      fillGenericGks,
      redistributeBench,
    });
    setGeneratedTeams(result);
    setSelectedTeamIds([]); // reset any previous selection
  };

  const handleToggleTeamSelect = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 2) return [prev[1], teamId]; // Keep only 2 selected max
      return [...prev, teamId];
    });
  };

  const handleClearTeams = () => {
    setGeneratedTeams(null);
    setSelectedTeamIds([]);
  };

  // ── Manual Team Logic ──────────────────────────────────────────────────
  const handleOpenManualModal = () => {
    // Pré-selecionar o banco
    if (generatedTeams?.bench) {
      setManualTeamPlayers([...generatedTeams.bench]);
    } else {
      setManualTeamPlayers([]);
    }
    setIsManualModalOpen(true);
  };

  const handleToggleManualPlayer = (player: Player) => {
    setManualTeamPlayers((prev) => {
      const isSelected = prev.some((p) => p.id === player.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== player.id);
      } else {
        if (prev.length >= playersPerTeam) {
          alert(
            `O time já está completo (${playersPerTeam} jogadores). Remova alguém primeiro.`,
          );
          return prev;
        }
        return [...prev, player];
      }
    });
  };

  const handleSaveManualTeam = () => {
    if (!generatedTeams) return;
    if (manualTeamPlayers.length === 0) {
      alert("Selecione pelo menos um jogador para o time manual.");
      return;
    }

    setManualTeamGenerating(true);
    setTimeout(() => {
      const teamLevel = manualTeamPlayers.reduce((sum, p) => sum + p.level, 0);

      if (editingBenchTeamIndex !== null && generatedTeams.benchTeams) {
        // Editing an existing bench team
        const updatedBenchTeams = [...generatedTeams.benchTeams];
        updatedBenchTeams[editingBenchTeamIndex] = {
          ...updatedBenchTeams[editingBenchTeamIndex],
          players: manualTeamPlayers,
          totalLevel: teamLevel,
        };
        setGeneratedTeams({
          ...generatedTeams,
          benchTeams: updatedBenchTeams,
        });
      } else {
        // Creating a brand-new manual team
        const newTeam: Team = {
          id: `manual-team-${Date.now()}`,
          name: `Time ${generatedTeams.teams.length + (generatedTeams.benchTeams?.length ?? 0) + 1}`,
          players: manualTeamPlayers,
          totalLevel: teamLevel,
        };
        setGeneratedTeams({
          ...generatedTeams,
          teams: [...generatedTeams.teams, newTeam],
          bench: [],
        });
      }

      setIsManualModalOpen(false);
      setEditingBenchTeamIndex(null);
      setManualTeamGenerating(false);
    }, 500);
  };

  // ── Edit Bench Team ───────────────────────────────────────────────────
  const handleEditBenchTeam = (index: number) => {
    if (!generatedTeams?.benchTeams?.[index]) return;
    setEditingBenchTeamIndex(index);
    setManualTeamPlayers([...generatedTeams.benchTeams[index].players]);
    setIsManualModalOpen(true);
  };

  // Helper to render a team card
  const TeamCard = ({
    team,
    colorClass,
  }: {
    team: Team;
    colorClass: string;
  }) => {
    const isSelected = selectedTeamIds.includes(team.id);

    return (
      <Card
        className={cn(
          "border-t-4 transition-all cursor-pointer relative overflow-hidden",
          colorClass,
          isSelected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
            : "hover:border-white/20 hover:bg-white/5 opacity-80 hover:opacity-100",
        )}
        onClick={() => handleToggleTeamSelect(team.id)}
      >
        {isSelected && (
          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-3 rounded-bl-lg shadow-bl">
            Selecionado
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-header flex items-center gap-2">
            {team.name}
          </h2>
          <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
            Nível: {team.totalLevel}
          </div>
        </div>
        <div className="space-y-2">
          {team.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded bg-white/5"
            >
              <div className="flex items-center gap-2">
                {p.position === "Goalkeeper" && (
                  <Shield size={14} className="text-yellow-500" />
                )}
                <span className="font-medium">{p.nickname || p.name}</span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(p.level)].map((_, i) => (
                  <div key={i} className="w-1 h-3 rounded-full bg-white/20" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-gray-400">
          <span>{team.players.length} Jogadores</span>
        </div>
      </Card>
    );
  };

  // Helper for Bench
  const BenchCard = ({ players }: { players: any[] }) => (
    <Card className="border-t-4 border-t-gray-500 bg-surface/50 opacity-80">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-header flex items-center gap-2 text-gray-400">
          <UserPlus size={18} /> Próximos
        </h2>
      </div>
      {players.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">
          Nenhum jogador de fora.
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded bg-white/5"
            >
              <div className="flex items-center gap-2 text-gray-400">
                {p.position === "Goalkeeper" && (
                  <Shield size={14} className="text-gray-500" />
                )}
                <span className="font-medium">{p.nickname || p.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
        <Button
          variant="secondary"
          onClick={handleOpenManualModal}
          className="w-full sm:w-auto p-1 text-xs h-8"
        >
          <Plus size={14} className="mr-1" /> Completar Time Manual
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-header text-primary">
          Sorteio de Times
        </h1>
        {generatedTeams && (
          <Button variant="secondary" onClick={handleClearTeams}>
            <RefreshCw size={18} className="mr-2" />
            Novo Sorteio
          </Button>
        )}
      </div>

      {!generatedTeams ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Selecione os Jogadores
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {attendanceIds.length} confirmados ·{" "}
                  {selectedPlayerIds.length} selecionados
                </span>
              </div>
            </div>

            {/* Config Panel */}
            <div className="mb-6 bg-white/5 border border-white/10 p-5 rounded-xl space-y-5">
              {/* Players Per Team row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    Jogadores por Time
                  </h3>
                  <p className="text-xs text-gray-400">
                    Define o limite exato de membros em quadra.
                  </p>
                </div>
                <div className="flex items-center bg-black/50 rounded-lg p-1">
                  {[4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPlayersPerTeam(num)}
                      className={cn(
                        "w-10 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors",
                        playersPerTeam === num
                          ? "bg-primary text-white shadow"
                          : "text-gray-400 hover:text-white",
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Random Generation Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <RefreshCw
                      size={14}
                      className={isRandom ? "text-primary" : "text-gray-500"}
                    />
                    Sorteio 100% Aleatório
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                    Ignora níveis e posições. Os jogadores são divididos
                    completamente na sorte rumo ao desconhecido.
                  </p>
                </div>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 outline-none",
                    isRandom ? "bg-primary" : "bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
                      isRandom ? "translate-x-6" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Generic GK Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <Shield
                      size={14}
                      className={
                        fillGenericGks && !isRandom
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }
                    />
                    Completar com Goleiros Genéricos
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                    Se faltarem goleiros para fechar 1 por time, o sistema
                    criará goleiros falsos para equilibrar a quantidade de
                    jogadores de linha.
                  </p>
                </div>
                <button
                  onClick={() => setFillGenericGks(!fillGenericGks)}
                  disabled={isRandom}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 outline-none",
                    isRandom
                      ? "bg-white/5 cursor-not-allowed opacity-50"
                      : fillGenericGks
                        ? "bg-yellow-500"
                        : "bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
                      fillGenericGks && !isRandom
                        ? "translate-x-6"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Redistribute Bench Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <Shuffle
                      size={14}
                      className={
                        redistributeBench ? "text-primary" : "text-gray-500"
                      }
                    />
                    Redistribuir Excedentes
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                    Jogadores que sobrarem serão redistribuídos em dois
                    sub-times extras ao invés de ficarem no banco.
                  </p>
                </div>
                <button
                  onClick={() => setRedistributeBench(!redistributeBench)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 outline-none",
                    redistributeBench ? "bg-primary" : "bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
                      redistributeBench ? "translate-x-6" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Empty state OR player list */}
            {attendanceLoaded && attendedPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                <p className="text-sm">Nenhum jogador confirmado para hoje.</p>
                <Link
                  to="/attendance"
                  className="text-primary text-sm hover:underline"
                >
                  → Fazer a chamada primeiro
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {attendedPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isPlaying = isPlayerPlaying(player.id);

                    return (
                      <button
                        key={player.id}
                        onClick={() => handleTogglePlayer(player.id)}
                        className={cn(
                          "relative group flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                          isSelected
                            ? "bg-primary/10 border-primary/40 shadow-sm"
                            : "bg-white/5 border-white/5 hover:border-white/20",
                          isPlaying && "opacity-60",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                              isSelected
                                ? "bg-primary text-background border-primary"
                                : "bg-white/5 text-gray-400 border-white/10",
                            )}
                          >
                            {(player.nickname || player.name)
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div
                              className={cn(
                                "text-sm font-semibold transition-colors",
                                isSelected ? "text-white" : "text-gray-400",
                              )}
                            >
                              {player.nickname || player.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={cn(
                                  "text-[10px] uppercase font-bold tracking-wider",
                                  player.position === "Goalkeeper"
                                    ? "text-yellow-500"
                                    : "text-gray-500",
                                )}
                              >
                                {player.position === "Goalkeeper"
                                  ? "Goleiro"
                                  : "Linha"}
                              </span>
                              {isPlaying && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                                  <span className="text-[10px] uppercase font-black text-primary tracking-widest bg-primary/10 px-1 rounded-sm">
                                    Em Jogo
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-white/10",
                          )}
                        >
                          {isSelected && (
                            <Check
                              size={12}
                              className="text-background"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" onClick={handleSelectAll}>
                    {selectedPlayerIds.length === attendedPlayers.length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                  <Button
                    onClick={handleGenerateTeams}
                    disabled={selectedPlayerIds.length < 2}
                    className="flex-1"
                  >
                    <Trophy size={18} className="mr-2" />
                    Gerar Times
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {unallocatedPlayers.length > 0 && (
            <Card className="border-t-4 border-t-amber-500 bg-amber-500/10 animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    {unallocatedPlayers.length}{" "}
                    {unallocatedPlayers.length === 1
                      ? "novo jogador chegou"
                      : "novos jogadores chegaram"}
                    !
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {unallocatedPlayers.length === 1
                      ? "Ele foi confirmado"
                      : "Eles foram confirmados"}{" "}
                    na chamada mas não{" "}
                    {unallocatedPlayers.length === 1 ? "está" : "estão"} no
                    sorteio atual.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleAddUnallocatedToBench}
                    className="text-xs py-1.5 h-auto"
                  >
                    Adicionar ao Banco
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Selecione <strong className="text-white">dois times</strong>{" "}
              abaixo para iniciar a partida.
            </p>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">
              {selectedTeamIds.length} / 2
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {generatedTeams.teams.map((team, index) => {
              const colors = [
                "border-t-yellow-500",
                "border-t-blue-500",
                "border-t-green-500",
                "border-t-purple-500",
                "border-t-rose-500",
              ];
              const colorClass = colors[index % colors.length];

              return (
                <TeamCard key={team.id} team={team} colorClass={colorClass} />
              );
            })}

            {/* Bench Queue (when redistribute is OFF) */}
            {generatedTeams.bench && generatedTeams.bench.length > 0 && (
              <BenchCard players={generatedTeams.bench} />
            )}
          </div>

          {/* Bench Teams (redistributed excess) */}
          {generatedTeams.benchTeams &&
            generatedTeams.benchTeams.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Times Extras
                  </h3>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                    Incompletos
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedTeams.benchTeams.map((team, index) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    const benchColors = [
                      "border-t-amber-500/60",
                      "border-t-teal-500/60",
                    ];
                    return (
                      <Card
                        key={team.id}
                        className={cn(
                          "border-t-4 border-dashed transition-all cursor-pointer relative overflow-hidden",
                          benchColors[index % benchColors.length],
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                            : "hover:border-white/20 hover:bg-white/5 opacity-80 hover:opacity-100",
                        )}
                        onClick={() => handleToggleTeamSelect(team.id)}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-3 rounded-bl-lg">
                            Selecionado
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold font-header">
                              {team.name}
                            </h2>
                            <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              {team.players.length}/{playersPerTeam}
                            </span>
                          </div>
                          <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono">
                            Nível: {team.totalLevel}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {team.players.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-2 rounded bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                {p.position === "Goalkeeper" && (
                                  <Shield
                                    size={14}
                                    className="text-yellow-500"
                                  />
                                )}
                                <span className="font-medium">
                                  {p.nickname || p.name}
                                </span>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(p.level)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1 h-3 rounded-full bg-white/20"
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            {team.players.length} Jogadores
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBenchTeam(index);
                            }}
                            className="flex items-center gap-1 text-xs text-primary hover:text-white bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <Plus size={14} /> Completar Time
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Match Control Panel */}
          {(selectedTeamIds.length === 2 ||
            useStore.getState().currentMatch.isActive) && (
            <div className="pt-8 border-t border-white/5 animate-in slide-in-from-bottom-8">
              <MatchControlPanel
                teamA={[
                  ...generatedTeams.teams,
                  ...(generatedTeams.benchTeams ?? []),
                ].find((t) => t.id === selectedTeamIds[0])}
                teamB={[
                  ...generatedTeams.teams,
                  ...(generatedTeams.benchTeams ?? []),
                ].find((t) => t.id === selectedTeamIds[1])}
              />
            </div>
          )}
        </div>
      )}

      {/* Manual Team Modal */}
      {isManualModalOpen && generatedTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-primary/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold font-header flex items-center gap-2">
                  <UserPlus className="text-primary" />
                  Montar Time Manual
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Monte um time extra com {manualTeamPlayers.length}/
                  {playersPerTeam} jogadores para jogar contra os outros.
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Players (Attended) */}
              <div>
                <h4 className="font-semibold text-gray-300 mb-3 border-b border-white/10 pb-2">
                  Todos os Presentes
                </h4>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {attendedPlayers.map((player) => {
                    const isSelected = manualTeamPlayers.some(
                      (p) => p.id === player.id,
                    );
                    const isInBench = generatedTeams.bench.some(
                      (p) => p.id === player.id,
                    );

                    return (
                      <div
                        key={player.id}
                        onClick={() => handleToggleManualPlayer(player)}
                        className={cn(
                          "cursor-pointer p-2.5 rounded border transition-all flex items-center justify-between",
                          isSelected
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-surface border-white/5 text-gray-400 hover:border-white/20",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              player.position === "Goalkeeper"
                                ? "bg-yellow-500"
                                : "bg-blue-400",
                              isSelected && "shadow-glow shadow-primary",
                            )}
                          />
                          <span className="font-medium text-sm">
                            {player.nickname || player.name}
                          </span>
                          {isInBench && (
                            <span className="text-[9px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded">
                              Banco
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded">
                          Lvl {player.level}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* New Team Preview */}
              <div>
                <h4 className="font-semibold text-primary mb-3 border-b border-white/10 pb-2">
                  Novo Time ({manualTeamPlayers.length}/{playersPerTeam})
                </h4>
                <div className="space-y-2">
                  {manualTeamPlayers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-white/10 rounded-lg">
                      Clique em jogadores na lista ao lado para adicionar.
                    </div>
                  ) : (
                    manualTeamPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          {p.position === "Goalkeeper" && (
                            <Shield size={14} className="text-yellow-500" />
                          )}
                          <span className="font-medium text-white">
                            {p.nickname || p.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleManualPlayer(p)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-current/10 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveManualTeam}
                disabled={
                  manualTeamGenerating || manualTeamPlayers.length === 0
                }
              >
                {manualTeamGenerating ? "Gerando..." : "Salvar Time Manual"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
