"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface PageContent {
    type: string;
    content: string;
    language?: string;
}

interface NotebookPageProps {
    title: string;
    pages: PageContent[];
    onComplete: () => void;
}

export function NotebookPage({ title, pages, onComplete }: NotebookPageProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward

    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            setDirection(1);
            setCurrentPage((prev) => prev + 1);
        } else {
            onComplete();
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setDirection(-1);
            setCurrentPage((prev) => prev - 1);
        }
    };

    const currentContent = pages[currentPage];

    // Variations for page turn animation
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            rotateY: direction > 0 ? 90 : -90,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            rotateY: 0,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            rotateY: direction < 0 ? 90 : -90,
        }),
    };

    return (
        <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-[#fdfbf7] shadow-2xl perspective-1000">
            {/* Notebook Spine */}
            <div className="absolute left-0 top-0 bottom-0 w-12 z-20 bg-gradient-to-r from-red-800 to-red-600 flex flex-col items-center justify-center gap-8 shadow-inner">
                <div className="w-1 h-full border-r border-black/10" />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-12 right-0 z-10 flex h-16 items-center justify-between border-b border-[#e5e5e5] bg-[#fdfbf7] px-8">
                <h2 className="font-handwriting text-2xl font-bold text-slate-800">{title}</h2>
                <span className="font-mono text-sm text-slate-500">
                    Page {currentPage + 1} of {pages.length}
                </span>
            </header>

            {/* Page Content */}
            <div className="relative flex-1 bg-[#fdfbf7] ml-12 p-8 pt-24">
                {/* Notebook Lines Background */}
                <div className="absolute inset-0 pointer-events-none bg-notebook-lines opacity-50" />
                {/* Margin Line */}
                <div className="absolute top-0 bottom-0 left-20 w-px bg-red-300/50" />

                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentPage}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            rotateY: { duration: 0.4 }
                        }}
                        className="relative z-0 h-full w-full pl-16 pr-4"
                    >
                        {currentContent.type === "text" && (
                            <div className="prose prose-slate max-w-none prose-headings:font-handwriting prose-headings:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-ul:text-slate-900 prose-ol:text-slate-900 prose-strong:text-slate-900 prose-code:text-slate-900 prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6 prose-li:ml-2 font-handwriting text-lg leading-loose text-slate-900">
                                <ReactMarkdown>{currentContent.content}</ReactMarkdown>
                            </div>
                        )}

                        {currentContent.type === "code" && (
                            <div className="not-prose my-6 rounded-lg bg-[#1e1e1e] p-4 font-mono text-sm text-white shadow-lg border border-slate-200 transform rotate-1">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                    <span className="text-xs text-slate-400">main.py</span>
                                    <Play size={14} className="text-green-400 hover:text-green-300 cursor-pointer" />
                                </div>
                                <pre className="whitespace-pre-wrap">{currentContent.content}</pre>
                            </div>
                        )}

                        {currentContent.type === "diagram" && (
                            <div className="my-8 flex justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-8">
                                <p className="font-handwriting text-xl text-slate-500">{currentContent.content}</p>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-0 left-12 right-0 z-10 flex h-20 items-center justify-between bg-gradient-to-t from-[#fdfbf7] to-transparent px-8">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 font-handwriting text-lg font-bold text-slate-700 transition-colors hover:bg-black/5 disabled:opacity-50",
                        currentPage === 0 && "cursor-not-allowed"
                    )}
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>

                <button
                    onClick={nextPage}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-6 py-2 font-handwriting text-lg font-bold text-white transition-colors hover:bg-slate-700 shadow-md"
                >
                    {currentPage === pages.length - 1 ? "Finish" : "Next Page"}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
