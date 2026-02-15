import { Crown } from "lucide-react";

const users = [
    { rank: 1, name: "CodeNinja", xp: 15420, avatar: "C", color: "text-yellow-400" },
    { rank: 2, name: "PyMaster", xp: 14850, avatar: "P", color: "text-slate-300" },
    { rank: 3, name: "AlgoQueen", xp: 13900, avatar: "A", color: "text-orange-400" },
    { rank: 4, name: "DevDave", xp: 12100, avatar: "D", color: "text-slate-400" },
    { rank: 5, name: "ScriptKiddie", xp: 11500, avatar: "S", color: "text-slate-400" },
];

export function Leaderboard() {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
                <Crown className="text-yellow-500" size={20} />
                <h3 className="font-bold text-white">Squad Leaderboard</h3>
            </div>

            <div className="space-y-4">
                {users.map((user) => (
                    <div key={user.rank} className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-white/5">
                        <div className={`flex h-8 w-8 items-center justify-center font-bold ${user.rank <= 3 ? "text-xl" : "text-sm text-slate-500"}`}>
                            {user.rank <= 3 ? (
                                <span className={user.color}>#{user.rank}</span>
                            ) : (
                                <span>{user.rank}</span>
                            )}
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold text-white">
                            {user.avatar}
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">Level {Math.floor(user.xp / 1000)}</p>
                        </div>

                        <div className="font-mono text-sm font-bold text-python-yellow">
                            {user.xp.toLocaleString()} XP
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
