import { posts } from "@/lib/placeholder-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";

export function StudentCircles() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="font-headline text-3xl font-bold">Student Circles</h1>
                <p className="text-muted-foreground">Connect and collaborate with your peers.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" alt="Your avatar" data-ai-hint="person face" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <Textarea placeholder="What's on your mind?" className="flex-1" />
                    </div>
                </CardHeader>
                <CardFooter className="flex justify-end">
                     <Button>
                        <Send className="mr-2 h-4 w-4" />
                        Post
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                {posts.map(post => (
                    <Card key={post.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <Avatar>
                                <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person face" />
                                <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{post.author.name}</p>
                                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground/90">{post.content}</p>
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
