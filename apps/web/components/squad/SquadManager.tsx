"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Lock, Globe, X, UserPlus } from "lucide-react";

interface Squad {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    privacy: "public" | "private";
    role: "owner" | "admin" | "member";
}

const mockSquads: Squad[] = [];

export function SquadManager() {
    const [squads, setSquads] = useState<Squad[]>(mockSquads);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSquad, setNewSquad] = useState({
        name: "",
        description: "",
        privacy: "private" as "public" | "private",
    });

    const handleCreateSquad = () => {
        if (!newSquad.name.trim()) return;

        const squad: Squad = {
            id: Date.now().toString(),
            name: newSquad.name,
            description: newSquad.description,
            memberCount: 1,
            privacy: newSquad.privacy,
            role: "owner",
        };

        setSquads(prev => [...prev, squad]);
        setShowCreateModal(false);
        setNewSquad({ name: "", description: "", privacy: "private" });
    };

    const handleLeaveSquad = (squadId: string) => {
        setSquads(prev => prev.filter(s => s.id !== squadId));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-white sm:text-2xl">My Squads</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 font-bold text-white hover:from-purple-600 hover:to-pink-700 sm:w-auto"
                >
                    <Plus size={16} />
                    Create Squad
                </button>
            </div>

            {squads.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-12">
                    <Users className="mx-auto mb-4 text-slate-400" size={48} />
                    <p className="text-slate-400">No squads yet.</p>
                    <p className="mt-2 text-sm text-slate-500">
                        Create a squad to collaborate and learn together!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {squads.map((squad) => (
                        <motion.div
                            key={squad.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                        >
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-white text-lg">{squad.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{squad.description}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    {squad.privacy === "private" ? (
                                        <Lock size={14} />
                                    ) : (
                                        <Globe size={14} />
                                    )}
                                    {squad.privacy}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Users size={16} />
                                    {squad.memberCount} {squad.memberCount === 1 ? "member" : "members"}
                                </div>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <button className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600">
                                        <UserPlus className="inline mr-1" size={12} />
                                        Invite
                                    </button>
                                    {squad.role !== "owner" && (
                                        <button
                                            onClick={() => handleLeaveSquad(squad.id)}
                                            className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-red-500 hover:text-white"
                                        >
                                            Leave
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Squad Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-4 sm:p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white sm:text-xl">Create New Squad</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">
                                        Squad Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newSquad.name}
                                        onChange={(e) => setNewSquad(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Python Masters"
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newSquad.description}
                                        onChange={(e) => setNewSquad(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="A squad for mastering Python together"
                                        rows={3}
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">
                                        Privacy
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setNewSquad(prev => ({ ...prev, privacy: "private" }))}
                                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-bold transition-colors ${newSquad.privacy === "private"
                                                    ? "border-purple-500 bg-purple-500/20 text-purple-400"
                                                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                                                }`}
                                        >
                                            <Lock size={16} />
                                            Private
                                        </button>
                                        <button
                                            onClick={() => setNewSquad(prev => ({ ...prev, privacy: "public" }))}
                                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-bold transition-colors ${newSquad.privacy === "public"
                                                    ? "border-purple-500 bg-purple-500/20 text-purple-400"
                                                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                                                }`}
                                        >
                                            <Globe size={16} />
                                            Public
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateSquad}
                                    disabled={!newSquad.name.trim()}
                                    className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-bold text-white hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Squad
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
