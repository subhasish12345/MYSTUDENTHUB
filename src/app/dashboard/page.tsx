import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notices, events } from "@/lib/placeholder-data";
import { Bell, Calendar, ArrowRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Welcome, Student!</h1>
        <p className="text-muted-foreground">Here's a quick overview of your academic life.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline">Notice Board</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {notices.slice(0, 3).map((notice) => (
                  <li key={notice.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{notice.title}</p>
                        {notice.isNew && <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notice.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notice.author} - {notice.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
           <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline">Upcoming Events</CardTitle>
              </div>
               <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/events">
                  Calendar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {events.slice(0, 2).map((event) => (
                  <li key={event.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                     <div className="flex flex-col items-center justify-center p-2 rounded-md bg-background text-foreground border">
                        <span className="text-xs font-bold uppercase">{format(event.date, 'MMM')}</span>
                        <span className="text-xl font-bold text-primary">{format(event.date, 'dd')}</span>
                     </div>
                    <div className="flex-1">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                       <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
