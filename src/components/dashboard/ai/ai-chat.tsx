"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Bot, Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { explainConcept } from "@/ai/flows/concept-explainer-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface Message {
    role: 'user' | 'model';
    content: string;
}

export function AiChat() {
    const { user, userData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (input.trim() === "") return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await explainConcept(input);
            setMessages([...newMessages, { role: 'model', content: response }]);
        } catch (error) {
            console.error("AI Error:", error);
            toast({ title: "AI Error", description: "The AI assistant could not be reached. Please try again later.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <>
            <Button
                className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50"
                onClick={() => setIsOpen(true)}
            >
                <Bot className="h-8 w-8" />
                <span className="sr-only">Open AI Assistant</span>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="flex flex-col sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle className="font-headline flex items-center gap-2">
                           <Bot /> AI Study Assistant
                        </SheetTitle>
                        <SheetDescription>
                            Ask questions, get explanations, and let AI help you learn.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 my-4 pr-4">
                        <div className="space-y-4">
                           {messages.length === 0 && (
                                <div className="text-center text-muted-foreground p-8">
                                    <p>Welcome to your AI Study Assistant!</p>
                                    <p className="text-sm">Try asking: "Explain binary search in simple terms."</p>
                                </div>
                            )}
                            {messages.map((message, index) => (
                                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'model' && (
                                        <Avatar>
                                            <AvatarFallback><Bot/></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`rounded-lg p-3 max-w-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                     {message.role === 'user' && userData && (
                                        <Avatar>
                                             <AvatarImage src={user?.photoURL || ''} alt={userData.name} />
                                             <AvatarFallback>{userData.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="relative">
                        <Textarea 
                            placeholder="Ask a question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleEnter}
                            className="pr-16"
                        />
                        <Button 
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            size="icon"
                            onClick={handleSend}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
