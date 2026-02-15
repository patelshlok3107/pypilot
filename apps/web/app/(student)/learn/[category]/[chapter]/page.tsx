"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { NotebookPage } from "@/components/learn/NotebookPage";
import { chapterContent } from "@/lib/mock-data";
import { useProgress } from "@/contexts/ProgressContext";

interface PageProps {
    params: Promise<{
        category: string;
        chapter: string;
    }>;
}

export default function ChapterPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { completeChapter, addXP } = useProgress();

    // In a real app, fetch data based on resolvedParams.category and resolvedParams.chapter
    // For prototype, we default to list-comprehensions if not found
    const content = chapterContent[resolvedParams.chapter as keyof typeof chapterContent] || chapterContent["list-comprehensions"];

    const handleComplete = () => {
        // Mark chapter as complete and award XP
        completeChapter(resolvedParams.chapter);
        addXP(50, `Completed all pages in ${content.title}`);
        router.push("/learn");
    };

    return (
        <div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4 md:p-8 animate-floatUp">
            <NotebookPage
                title={content.title}
                pages={content.pages}
                onComplete={handleComplete}
            />
        </div>
    );
}
