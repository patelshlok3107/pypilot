import Link from "next/link";
import { Trophy, Clock, Zap } from "lucide-react";

interface ChallengeCardProps {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    xp: number;
    timeEstimate: string;
    tags: string[] | readonly string[];
}

const difficultyColors = {
    Easy: "text-green-400 bg-green-400/10 border-green-400/20",
    Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Hard: "text-red-400 bg-red-400/10 border-red-400/20",
};

export function ChallengeCard({ id, title, difficulty, xp, timeEstimate, tags }: ChallengeCardProps) {
    return (
        <Link
            href={`/practice/${id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:shadow-glow"
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <Zap className="text-yellow-400" size={20} fill="currentColor" />
            </div>

            <div>
                <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyColors[difficulty]}`}>
                        {difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} /> {timeEstimate}
                    </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-white group-hover:text-python-blue-light transition-colors">{title}</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="text-xs text-slate-500">#{tag}</span>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-yellow-400">
                    <Trophy size={16} />
                    <span className="font-bold">{xp} XP</span>
                </div>
                <span className="text-sm font-medium text-python-blue opacity-0 transition-opacity group-hover:opacity-100">
                    Start Challenge →
                </span>
            </div>
        </Link>
    );
}
