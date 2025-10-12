"use client";

import { useState, useEffect } from "react";
import { Post, PostAuthor } from "./chat-panel";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostCardProps {
    post: Post;
    groupId: string;
}

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}


export function PostCard({ post, groupId }: PostCardProps) {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasLiked = user ? post.likes?.includes(user.uid) : false;

    const handleLikeToggle = async () => {
        if (!user) {
            toast({ title: "Please log in", description: "You must be logged in to like a post.", variant: "destructive" });
            return;
        }
        const postRef = doc(db, "circles", groupId, "posts", post.id);
        try {
            if (hasLiked) {
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
            }
        } catch (error: any) {
             toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
        }
    };


    const handleReplySubmit = async () => {
        if (!user || !userData || replyContent.trim() === "") return;
        setIsSubmitting(true);

        const postRef = doc(db, "circles", groupId, "posts", post.id);
        const replyData = {
            id: doc(collection(db, "circles")).id, // Generate a unique ID for the reply
            author: {
                name: userData.name || "Anonymous",
                avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
                uid: user.uid,
            },
            content: replyContent,
            timestamp: new Date(), // Use client-side timestamp for arrayUnion
        };

        try {
            await updateDoc(postRef, {
                replies: arrayUnion(replyData)
            });
            setReplyContent("");
            setShowReply(false);
        } catch (error: any) {
            console.error("Error submitting reply:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return formatDistanceToNow(date, { addSuffix: true });
    };


    return (
        <div className="comic-card" role="article">
            <div className="card-header">
                <Avatar className="card-avatar">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person face" />
                    <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="card-user-info">
                    <p className="card-username">{post.author.name}</p>
                    <p className="card-handle">
                        <ClientOnly>
                            {formatTimestamp(post.timestamp)}
                        </ClientOnly>
                    </p>
                </div>
            </div>
            <div className="card-content">
                <div className="card-caption">
                    <p>{post.content}</p>
                </div>
            </div>
            <div className="card-actions">
                <button className={cn("action-button like-button", hasLiked && "liked")} aria-label="Like Post" onClick={handleLikeToggle}>
                    <Heart className="action-button-icon" />
                    <span className="like-count">{post.likes?.length || 0}</span>
                </button>
                <button className="action-button comment-button" aria-label="Comment on Post" onClick={() => setShowReply(!showReply)}>
                    <MessageSquare className="action-button-icon" />
                </button>
            </div>

            {showReply && (
                <div className="mt-4 w-full flex items-start gap-4 p-2">
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} alt="Your avatar" data-ai-hint="person face" />
                        <AvatarFallback>{userData?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                         <Textarea 
                            placeholder="Write a reply..." 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowReply(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleReplySubmit} disabled={isSubmitting || replyContent.trim() === ""}>
                                <Send className="mr-2 h-4 w-4" />
                                {isSubmitting ? "Replying..." : "Reply"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
             {post.replies && post.replies.length > 0 && (
                <div className="w-full space-y-4 pt-4 mt-4 border-t-2 border-dashed border-gray-300">
                    {post.replies.sort((a,b) => (b.timestamp?.toDate?.() || b.timestamp) - (a.timestamp?.toDate?.() || a.timestamp)).map((reply: any, index: number) => (
                         <div key={reply.id || index} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={reply.author.avatarUrl} alt={reply.author.name} data-ai-hint="person face" />
                                <AvatarFallback>{reply.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{reply.author.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                       <ClientOnly>
                                         {formatTimestamp(reply.timestamp)}
                                       </ClientOnly>
                                    </p>
                                </div>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
