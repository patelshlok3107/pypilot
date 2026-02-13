"use client";

import { Sidebar } from "./Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#030712] text-white">
            <Sidebar />
            <main className="flex-1 transition-all duration-300 md:ml-64">
                <div className="container mx-auto p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
