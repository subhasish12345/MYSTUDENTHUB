"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "./post-card";

export interface PostAuthor {
    name: string;
    avatarUrl: string;
    uid: string;
}

export interface Reply {
    id: string;
    author: PostAuthor;
    content: string;
    timestamp: any;
}

export interface Post extends DocumentData {
    id: string;
    author: PostAuthor;
    content: string;
    timestamp: any;
    replies?: Reply[];
}

export function ChatPanel({ group }: { group: DocumentData }) {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const postsCollectionRef = collection(db, "circles", group.id, "posts");

    useEffect(() => {
        setLoading(true);
        const q = query(postsCollectionRef, orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postsData);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching posts for group ${group.id}:`, error);
            toast({ title: "Error", description: "Could not fetch circle posts. You may not have permission to view this group.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [group.id, toast, postsCollectionRef]);

    const handlePostSubmit = async () => {
        if (!user || !userData || newPostContent.trim() === "") return;
        
        setIsSubmitting(true);
        try {
            await addDoc(postsCollectionRef, {
                content: newPostContent,
                author: {
                    name: userData.name || "Anonymous",
                    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
                    uid: user.uid,
                },
                timestamp: serverTimestamp(),
            });
            setNewPostContent("");
        } catch (error: any) {
            console.error("Error creating post:", error);
            toast({ title: "Error", description: error.message || "Could not create post.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
             <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <Avatar>
                            <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} alt="Your avatar" data-ai-hint="person face" />
                            <AvatarFallback>{userData?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <Textarea 
                            placeholder="What's on your mind?" 
                            className="flex-1" 
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardFooter className="flex justify-end">
                     <Button onClick={handlePostSubmit} disabled={isSubmitting || newPostContent.trim() === ""}>
                        {isSubmitting ? "Posting..." : <><Send className="mr-2 h-4 w-4" /> Post</>}
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                 {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
                    ))
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} groupId={group.id} />
                    ))
                ) : (
                    <div className="text-center py-16 border-dashed border-2 rounded-lg">
                        <h3 className="font-headline text-2xl font-semibold">It's quiet in here...</h3>
                        <p className="text-muted-foreground">Be the first to start a conversation in this group!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
