import { ChallengeCard } from "@/components/practice/ChallengeCard";
import { Flame } from "lucide-react";

const challenges = [
  { id: "1", title: "Fibonacci Sequence", difficulty: "Easy", xp: 50, timeEstimate: "10m", tags: ["loops", "math"] },
  { id: "2", title: "Palindrome Checker", difficulty: "Easy", xp: 50, timeEstimate: "15m", tags: ["strings"] },
  { id: "3", title: "Binary Search Algo", difficulty: "Medium", xp: 120, timeEstimate: "30m", tags: ["algorithms", "lists"] },
  { id: "4", title: "Data Analysis Basics", difficulty: "Medium", xp: 100, timeEstimate: "25m", tags: ["pandas", "data"] },
  { id: "5", title: "Neural Net from Scratch", difficulty: "Hard", xp: 500, timeEstimate: "2h", tags: ["ai", "math", "classes"] },
  { id: "6", title: "Async Web Scraper", difficulty: "Hard", xp: 350, timeEstimate: "1h", tags: ["asyncio", "web"] },
] as const;

export default function PracticePage() {
  return (
    <div className="space-y-8 animate-floatUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Coding Challenges</h1>
          <p className="mt-2 text-slate-400">Sharpen your skills with real-world problems.</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-3 border border-orange-500/30">
          <Flame className="text-orange-500" />
          <div>
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">Daily Goal</p>
            <p className="text-sm font-semibold text-white">Solve 1 Challenge</p>
          </div>
        </div>
      </div>

      {/* Filters (Visual only for prototype) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["All", "Easy", "Medium", "Hard", "Algorithms", "Data Science"].map((filter, i) => (
          <button key={filter} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === 0 ? "bg-white text-black" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} {...challenge} />
        ))}
      </div>
    </div>
  );
}
