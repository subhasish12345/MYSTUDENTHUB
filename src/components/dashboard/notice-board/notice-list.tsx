"use client";

import { Notice } from "./notice-board";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { UserCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from "firebase/auth";
import { Roles } from "@/lib/roles";
import { useEffect, useState } from "react";


interface NoticeListProps {
    notices: Notice[];
    loading: boolean;
    currentUser: User | null;
    userRole: Roles | null;
    onEdit: (notice: Notice) => void;
    onDelete: (notice: Notice) => void;
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


export function NoticeList({ notices, loading, currentUser, userRole, onEdit, onDelete }: NoticeListProps) {

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (notices.length === 0) {
        return (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
                <h3 className="font-headline text-2xl font-semibold">No Notices Yet</h3>
                <p className="text-muted-foreground">Check back later for announcements.</p>
            </div>
        );
    }
    
    const getTargetAudience = (notice: Notice) => {
        const { type, degree, stream, batch } = notice.target;
        if (type === 'global') return 'Global';
        if (type === 'degree') return `Degree: ${degree}`;
        if (type === 'stream') return `Stream: ${degree} / ${stream}`;
        if (type === 'batch') return `Batch: ${degree} / ${stream} / ${batch}`;
        return 'Targeted';
    }


    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notices.map(notice => {
                const canModify = userRole === 'admin' || (userRole === 'teacher' && notice.postedBy === currentUser?.uid);
                
                return (
                    <Card key={notice.id} className="flex flex-col">
                        {notice.imageUrl && (
                            <div className="relative h-40 w-full">
                                <Image
                                    src={notice.imageUrl}
                                    alt={notice.title}
                                    fill
                                    objectFit="cover"
                                    className="rounded-t-lg"
                                    data-ai-hint="announcement poster"
                                />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle>{notice.title}</CardTitle>
                                    <CardDescription>
                                        <ClientOnly>
                                            {notice.createdAt ? formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                        </ClientOnly>
                                    </CardDescription>
                                </div>
                                {canModify && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(notice)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(notice)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4"/>
                            <span>{notice.postedByName || 'Admin'}</span>
                        </div>
                        <Badge variant="outline">{getTargetAudience(notice)}</Badge>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
}
