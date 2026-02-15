"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, UserPlus, Filter, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface NearbyUser {
    id: string;
    name: string;
    avatar: string;
    level: number;
    xp: number;
    distance: number; // in km
    interests: string[];
    online: boolean;
}

// Mock data for demonstration
const mockNearbyUsers: NearbyUser[] = [
    {
        id: "1",
        name: "Sarah Chen",
        avatar: "👩‍💻",
        level: 8,
        xp: 2400,
        distance: 1.2,
        interests: ["Python", "Data Science"],
        online: true,
    },
    {
        id: "2",
        name: "Mike Johnson",
        avatar: "👨‍💼",
        level: 12,
        xp: 5600,
        distance: 2.8,
        interests: ["Python", "Web Dev"],
        online: false,
    },
    {
        id: "3",
        name: "Priya Sharma",
        avatar: "👩‍🎓",
        level: 6,
        xp: 1800,
        distance: 0.5,
        interests: ["Python", "AI/ML"],
        online: true,
    },
];

export function UserDiscovery() {
    const { latitude, longitude, error, loading, requestLocation } = useGeolocation();
    const [users, setUsers] = useState<NearbyUser[]>([]);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

    const handleFindUsers = () => {
        requestLocation();
        // Simulate API call
        setTimeout(() => {
            setUsers(mockNearbyUsers);
        }, 1000);
    };

    const handleSendRequest = (userId: string) => {
        setSentRequests(prev => new Set(prev).add(userId));
        // TODO: API call to send friend request
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Discover Learners</h2>
                <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 border border-white/10">
                    <Filter size={16} />
                    Filters
                </button>
            </div>

            {!latitude && !loading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <MapPin className="mx-auto mb-4 text-slate-400" size={48} />
                    <h3 className="mb-2 text-lg font-bold text-white">Find Nearby Learners</h3>
                    <p className="mb-6 text-sm text-slate-400">
                        Discover Python learners near you and connect to learn together!
                    </p>
                    <button
                        onClick={handleFindUsers}
                        className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-bold text-white hover:from-green-600 hover:to-emerald-700"
                    >
                        <MapPin className="inline mr-2" size={16} />
                        Enable Location
                    </button>
                    {error && (
                        <p className="mt-4 text-sm text-red-400">{error}</p>
                    )}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            )}

            {latitude && users.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {users.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="text-4xl">{user.avatar}</div>
                                        {user.online && (
                                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{user.name}</h3>
                                        <p className="text-sm text-slate-400">
                                            Level {user.level} • {user.xp} XP
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            <MapPin className="inline" size={12} /> {user.distance} km away
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {user.interests.map((interest) => (
                                                <span
                                                    key={interest}
                                                    className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendRequest(user.id)}
                                    disabled={sentRequests.has(user.id)}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${sentRequests.has(user.id)
                                            ? "bg-white/5 text-slate-500 cursor-not-allowed"
                                            : "bg-blue-500 text-white hover:bg-blue-600"
                                        }`}
                                >
                                    <UserPlus size={16} />
                                    {sentRequests.has(user.id) ? "Sent" : "Add"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
