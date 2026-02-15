"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/mock-data";
import { ChevronRight, PlayCircle, CheckCircle } from "lucide-react";

interface PageProps {
    params: Promise<{
        category: string;
    }>;
}

export default function CategoryPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const category = categories.find((c) => c.id === resolvedParams.category);

    if (!category) {
        notFound();
    }

    return (
        <div className="space-y-8 animate-floatUp">
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${category.color} p-8 md:p-12`}>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white mb-4">{category.title}</h1>
                    <p className="text-white/80 text-lg max-w-2xl">{category.description}</p>
                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {/* Enrollment indicators removed for realism */}
                        </div>
                        <span className="text-sm font-medium text-white/90">Start Learning</span>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h- full w-1/2 bg-white/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
                <h2 className="text-xl font-bold text-white mb-6">Course Content</h2>
                {category.chaptersList?.map((chapter, index) => (
                    <Link
                        key={chapter.id}
                        href={`/learn/${category.id}/${chapter.id}`}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.01]"
                    >
                        <div className="flex items-center gap-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-mono text-slate-400">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div>
                                <h3 className="font-medium text-white group-hover:text-python-blue-light transition-colors">{chapter.title}</h3>
                                <p className="text-xs text-slate-500">15 mins • 50 XP</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {chapter.completed ? (
                                <CheckCircle className="text-green-500" size={20} />
                            ) : (
                                <PlayCircle className="text-slate-500 group-hover:text-white transition-colors" size={20} />
                            )}
                            <ChevronRight className="text-slate-600 group-hover:translate-x-1 transition-transform" size={16} />
                        </div>
                    </Link>
                ))}

                {(!category.chaptersList || category.chaptersList.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                        No chapters available yet. Check back soon!
                    </div>
                )}
            </div>
        </div>
    );
}
