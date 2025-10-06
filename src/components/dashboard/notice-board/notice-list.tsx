
"use client";

import { Notice } from "./notice-board";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";


interface NoticeListProps {
    notices: Notice[];
    loading: boolean;
}

export function NoticeList({ notices, loading }: NoticeListProps) {

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
            {notices.map(notice => (
                <Card key={notice.id} className="flex flex-col">
                    {notice.imageUrl && (
                        <div className="relative h-40 w-full">
                            <Image
                                src={notice.imageUrl}
                                alt={notice.title}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-t-lg"
                                data-ai-hint="announcement poster"
                            />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>{notice.title}</CardTitle>
                        <CardDescription>
                             {formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true })}
                        </CardDescription>
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
            ))}
        </div>
    );
}

