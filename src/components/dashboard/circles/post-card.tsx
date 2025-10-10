
"use client";

import { useState, useEffect } from "react";
import { Post, PostAuthor } from "./chat-panel";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
            timestamp: serverTimestamp(),
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


    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <Avatar>
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person face" />
                    <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                        <ClientOnly>
                          {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                        </ClientOnly>
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                <Button variant="ghost" size="sm" onClick={() => setShowReply(!showReply)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Reply
                </Button>
                {showReply && (
                    <div className="w-full flex items-start gap-4 pl-4 border-l-2">
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
                    <div className="w-full space-y-4 pt-4">
                        {post.replies.sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis()).map((reply: any, index: number) => (
                             <div key={reply.id || index} className="flex items-start gap-3 pl-4 border-l-2 ml-4">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={reply.author.avatarUrl} alt={reply.author.name} data-ai-hint="person face" />
                                    <AvatarFallback>{reply.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{reply.author.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                           <ClientOnly>
                                             {reply.timestamp ? formatDistanceToNow(reply.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                                           </ClientOnly>
                                        </p>
                                    </div>
                                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
