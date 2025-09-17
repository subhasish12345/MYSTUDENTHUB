"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";

export function FocusSession() {
    const [totalSeconds, setTotalSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [topic, setTopic] = useState("Study Session");

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    useEffect(() => {
        if (isActive && totalSeconds > 0) {
            intervalRef.current = setInterval(() => {
                setTotalSeconds(s => s - 1);
            }, 1000);
        } else if (!isActive || totalSeconds === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if(totalSeconds === 0) {
                setIsActive(false);
            }
        }
        
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, totalSeconds]);
    
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = (newTime: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        setTotalSeconds(newTime);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold text-center">Focus Session</h1>
                <p className="text-muted-foreground text-center">Minimize distractions and maximize productivity.</p>
            </div>
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <Input 
                        className="text-center text-2xl font-headline border-0 shadow-none focus-visible:ring-0"
                        defaultValue={topic}
                        onChange={(e) => setTopic(e.target.value || "Study Session")}
                    />
                    <CardDescription>Stay focused on your goal.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="text-8xl font-bold font-mono text-primary tabular-nums">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    
                    <div className="flex w-full gap-2">
                        <Button variant="default" size="lg" onClick={toggleTimer} className="flex-1">
                            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => resetTimer(25 * 60)}>
                           <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="w-full space-y-2">
                         <div className="flex gap-2 justify-center">
                            <Button variant="ghost" size="sm" onClick={() => resetTimer(25 * 60)}>25 min</Button>
                            <Button variant="ghost" size="sm" onClick={() => resetTimer(45 * 60)}>45 min</Button>
                            <Button variant="ghost" size="sm" onClick={() => resetTimer(60 * 60)}>60 min</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
