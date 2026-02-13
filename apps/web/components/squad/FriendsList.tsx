"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserMinus, MessageCircle, Check, X } from "lucide-react";

interface Friend {
    id: string;
    name: string;
    avatar: string;
    level: number;
    online: boolean;
    lastSeen?: string;
}

interface FriendRequest {
    id: string;
    from: Friend;
    timestamp: string;
}

// Mock data
const mockFriends: Friend[] = [];

const mockRequests: FriendRequest[] = [];

export function FriendsList() {
    const [friends, setFriends] = useState<Friend[]>(mockFriends);
    const [requests, setRequests] = useState<FriendRequest[]>(mockRequests);

    const handleAcceptRequest = (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            setFriends(prev => [...prev, request.from]);
            setRequests(prev => prev.filter(r => r.id !== requestId));
        }
    };

    const handleRejectRequest = (requestId: string) => {
        setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleRemoveFriend = (friendId: string) => {
        setFriends(prev => prev.filter(f => f.id !== friendId));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white sm:text-2xl">Friends</h2>

            {/* Friend Requests */}
            {requests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                        Pending Requests ({requests.length})
                    </h3>
                    {requests.map((request) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{request.from.avatar}</div>
                                    <div>
                                        <p className="font-bold text-white">{request.from.name}</p>
                                        <p className="text-xs text-slate-400">Level {request.from.level}</p>
                                    </div>
                                </div>
                                <div className="flex w-full gap-2 sm:w-auto">
                                    <button
                                        onClick={() => handleAcceptRequest(request.id)}
                                        className="flex-1 rounded-lg bg-green-500 p-2 text-white hover:bg-green-600 sm:flex-none"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleRejectRequest(request.id)}
                                        className="flex-1 rounded-lg bg-red-500 p-2 text-white hover:bg-red-600 sm:flex-none"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Friends List */}
            {friends.length === 0 && requests.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-12">
                    <p className="text-slate-400">No friends yet.</p>
                    <p className="mt-2 text-sm text-slate-500">
                        Discover nearby learners to start building your squad!
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {friends.map((friend) => (
                        <motion.div
                            key={friend.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="text-3xl">{friend.avatar}</div>
                                        {friend.online && (
                                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{friend.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {friend.online ? "Online" : `Last seen ${friend.lastSeen}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex w-full gap-2 sm:w-auto">
                                    <button className="flex-1 rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 sm:flex-none">
                                        <MessageCircle size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFriend(friend.id)}
                                        className="flex-1 rounded-lg bg-white/5 p-2 text-slate-400 hover:bg-red-500 hover:text-white sm:flex-none"
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
