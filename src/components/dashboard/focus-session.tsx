"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from '../ui/progress';

export function FocusSession() {
    const [timer, setTimer] = useState(25 * 60); // Default to 25 minutes
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [topic, setTopic] = useState("Study Session");

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const progress = ((initialTime - timer) / initialTime) * 100;

    useEffect(() => {
        if (isActive && timer > 0) {
            intervalRef.current = setInterval(() => {
                setTimer(t => t - 1);
            }, 1000);
        } else if (!isActive || timer === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timer === 0 && isActive) {
                // Handle session end
                setIsActive(false);
                alert(`Focus session "${topic}" complete!`);
                // Here you would typically save the session to Firestore
            }
        }
        
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timer, topic]);
    
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = (newTimeInMinutes: number) => {
        const newTimeInSeconds = newTimeInMinutes * 60;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        setInitialTime(newTimeInSeconds);
        setTimer(newTimeInSeconds);
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
                    <div className="relative h-48 w-48">
                         <Progress value={progress} className="absolute h-full w-full rounded-full [&>div]:bg-primary/20" />
                         <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold font-mono text-primary tabular-nums">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>
                    
                    <div className="flex w-full gap-2">
                        <Button variant="default" size="lg" onClick={toggleTimer} className="flex-1">
                            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => resetTimer(initialTime/60)}>
                           <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>

                    
                </CardContent>
                 <CardFooter className="flex justify-center gap-2 pt-0">
                    <Button variant="ghost" size="sm" onClick={() => resetTimer(25)}>25 min</Button>
                    <Button variant="ghost" size="sm" onClick={() => resetTimer(45)}>45 min</Button>
                    <Button variant="ghost" size="sm" onClick={() => resetTimer(60)}>60 min</Button>
                 </CardFooter>
            </Card>
        </div>
    );
}
