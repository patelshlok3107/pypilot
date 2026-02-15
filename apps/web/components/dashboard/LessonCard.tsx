import { Play, BookOpen } from "lucide-react";
import Link from "next/link";

export function LessonCard() {
    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-python-blue/20 to-python-yellow/5 p-8 transition-all hover:border-python-blue/30">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-python-blue/20 blur-3xl transition-all group-hover:bg-python-blue/30" />

            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-python-blue/20 text-python-blue-light">
                        <BookOpen size={16} />
                    </span>
                    <span className="text-sm font-medium tracking-wider text-python-blue-light uppercase">Recommended Lesson</span>
                </div>

                <h2 className="mt-4 text-3xl font-bold text-white">Advanced List Comprehensions</h2>
                <p className="mt-2 text-slate-400 max-w-md">Master the art of concise list creation in Python. Learn filtering, nested loops, and best practices.</p>

                <div className="mt-6 flex items-center gap-4">
                    <Link href="/learn/advanced-python/list-comprehensions" className="flex items-center gap-2 rounded-xl bg-python-blue px-6 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-python-blue/25">
                        <Play size={18} fill="currentColor" />
                        <span>Continue Learning</span>
                    </Link>
                    <span className="text-sm text-slate-500">15 min • 50 XP</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
                <div className="h-full w-[35%] bg-gradient-to-r from-python-blue to-python-yellow shadow-[0_0_10px_rgba(55,118,171,0.5)]" />
            </div>
        </div>
    );
}
