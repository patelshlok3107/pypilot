import { PlayCircle, CheckCircle, Code2, Trophy } from "lucide-react";

interface Activity {
    id: number;
    type: "lesson" | "practice" | "achievement";
    title: string;
    time: string;
    xp: number;
}

const activities: Activity[] = [
    { id: 1, type: "lesson", title: "Finished: Python Loops", time: "2h ago", xp: 50 },
    { id: 2, type: "practice", title: "Solved: Fibonacci Series", time: "5h ago", xp: 30 },
    { id: 3, type: "achievement", title: "Earned: Logic Master", time: "1d ago", xp: 100 },
];

const icons = {
    lesson: PlayCircle,
    practice: Code2,
    achievement: Trophy,
};

const colors = {
    lesson: "text-blue-400",
    practice: "text-green-400",
    achievement: "text-yellow-400",
};

export function ActivityTimeline() {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <div className="relative border-l border-white/10 ml-3 space-y-6">
                {activities.map((activity) => {
                    const Icon = icons[activity.type];
                    return (
                        <div key={activity.id} className="relative pl-8">
                            <span className={`absolute -left-[9px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0f1c] ring-2 ring-[#0a0f1c] ${colors[activity.type]}`}>
                                <Icon size={14} />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{activity.title}</span>
                                <span className="text-xs text-slate-400">{activity.time} • +{activity.xp} XP</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
