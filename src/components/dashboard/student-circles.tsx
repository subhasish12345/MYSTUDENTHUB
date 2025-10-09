"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PostAuthor {
    name: string;
    avatarUrl: string;
    uid: string;
}

interface Post extends DocumentData {
    id: string;
    author: PostAuthor;
    content: string;
    timestamp: any;
}

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null; // On the server, render nothing.
    }

    return <>{children}</>;
}


export function StudentCircles() {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "circles", "general", "posts"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            toast({ title: "Error", description: "Could not fetch circle posts.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handlePostSubmit = async () => {
        if (!user || !userData || newPostContent.trim() === "") return;
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "circles", "general", "posts"), {
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
            toast({ title: "Error", description: "Could not create post. Check permissions.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="font-headline text-3xl font-bold">Student Circles</h1>
                <p className="text-muted-foreground">Connect and collaborate with your peers in the general circle.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
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
                ) : posts.map(post => (
                    <Card key={post.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
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
                        <CardFooter>
                            <Button variant="ghost" size="sm">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Reply
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
