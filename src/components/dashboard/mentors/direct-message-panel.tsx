
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, DocumentData, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { UserData } from "../admin/teacher-management";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: any;
}

export function DirectMessagePanel({ mentor, onBack }: { mentor: UserData, onBack: () => void }) {
    const { user, userData, userRole } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatId = useMemo(() => {
        if (!user || !mentor) return null;
        // Create a consistent chat ID regardless of who initiates the chat
        return [user.uid, mentor.id].sort().join('_');
    }, [user, mentor]);

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }

        const messagesQuery = query(collection(db, "directMessages", chatId, "messages"), orderBy("timestamp", "asc"));
        
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            // This error often means the collection doesn't exist yet, which is fine for new chats.
            // We'll let the handleSendMessage function create it.
            console.warn("Could not fetch messages (this is expected for new chats):", error.message);
            setMessages([]); // Ensure messages are cleared if there's an issue
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);
    
    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!user || !chatId || newMessage.trim() === "" || !userRole || !mentor.role) {
            toast({ title: "Error", description: "Cannot send message. Missing user data.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        
        try {
            const chatDocRef = doc(db, "directMessages", chatId);
            const chatDoc = await getDoc(chatDocRef);

            // If the chat document doesn't exist, create it first.
            // This is the crucial step for initiating a new chat.
            if (!chatDoc.exists()) {
                 await setDoc(chatDocRef, {
                    participants: [user.uid, mentor.id],
                    participantRoles: {
                        [user.uid]: userRole,
                        [mentor.id]: mentor.role,
                    },
                    lastMessage: newMessage,
                    updatedAt: serverTimestamp(),
                });
            } else {
                // If it exists, just update the last message timestamp
                await setDoc(chatDocRef, { lastMessage: newMessage, updatedAt: serverTimestamp() }, { merge: true });
            }

            // Now, add the new message to the subcollection
            const messagesColRef = collection(db, "directMessages", chatId, "messages");
            await addDoc(messagesColRef, {
                text: newMessage,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            });

            setNewMessage("");

        } catch (error: any) {
            console.error("Failed to send message: ", error);
            toast({ title: "Error Sending Message", description: `Could not send message. Please check your permissions.`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isMyMessage = (senderId: string) => user?.uid === senderId;

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4 border-b">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                    <AvatarImage src={mentor.photoURL} alt={mentor.name} data-ai-hint="person face" />
                    <AvatarFallback>{mentor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{mentor.name}</CardTitle>
                    <CardDescription>{mentor.designation || mentor.role}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                 {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-2/3" />
                        <Skeleton className="h-16 w-2/3 ml-auto" />
                        <Skeleton className="h-16 w-2/3" />
                    </div>
                 ) : messages.length > 0 ? (
                    messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", isMyMessage(msg.senderId) ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg", isMyMessage(msg.senderId) ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <p className={cn("text-xs mt-1", isMyMessage(msg.senderId) ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                     {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'sending...'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="border-t p-4">
                 <div className="flex w-full items-center gap-2">
                    <Textarea 
                        placeholder="Type your message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        className="min-h-0 h-10 max-h-24"
                    />
                    <Button onClick={handleSendMessage} disabled={isSubmitting || newMessage.trim() === ""}>
                       <Send className="h-4 w-4"/>
                       <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
