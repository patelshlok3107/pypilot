"use client";

import { useState } from "react";
import { Users, Compass, MessageSquare } from "lucide-react";
import { UserDiscovery } from "@/components/squad/UserDiscovery";
import { FriendsList } from "@/components/squad/FriendsList";
import { SquadManager } from "@/components/squad/SquadManager";
import { ChatInterface } from "@/components/squad/ChatInterface";

type Tab = "discover" | "friends" | "squads" | "chat";

export default function SquadPage() {
    const [activeTab, setActiveTab] = useState<Tab>("discover");

    const tabs = [
        { id: "discover" as Tab, label: "Discover", icon: Compass },
        { id: "friends" as Tab, label: "Friends", icon: Users },
        { id: "squads" as Tab, label: "Squads", icon: Users },
        { id: "chat" as Tab, label: "Chat", icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Squad</h1>
                    <p className="text-slate-400">Connect with fellow Python learners and grow together</p>
                </div>

                {/* Tabs */}
                <div className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    {activeTab === "discover" && <UserDiscovery />}
                    {activeTab === "friends" && <FriendsList />}
                    {activeTab === "squads" && <SquadManager />}
                    {activeTab === "chat" && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">Squad Chat</h2>
                            <p className="text-slate-400 mb-6">
                                Select a squad to start chatting with your teammates!
                            </p>
                            <ChatInterface />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
