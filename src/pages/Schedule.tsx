import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Video, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockUsers } from "@/data/mockData";

const Schedule = () => {
  const upcomingSessions = [
    { id: 1, title: "Japanese Calligraphy", partner: mockUsers[1], time: "Today, 3:00 PM", date: "Dec 5, 2024", type: "Learning", format: "online", duration: "1.5 hours" },
    { id: 2, title: "Web Development Basics", partner: mockUsers[2], time: "Tomorrow, 10:00 AM", date: "Dec 6, 2024", type: "Teaching", format: "online", duration: "2 hours" },
    { id: 3, title: "Yoga Introduction", partner: mockUsers[4], time: "2:00 PM", date: "Dec 8, 2024", type: "Learning", format: "online", duration: "1 hour" },
    { id: 4, title: "African Textile Art", partner: mockUsers[0], time: "5:00 PM", date: "Dec 10, 2024", type: "Learning", format: "online", duration: "2 hours" },
    { id: 5, title: "Spanish Conversation", partner: mockUsers[2], time: "11:00 AM", date: "Dec 12, 2024", type: "Teaching", format: "online", duration: "1 hour" },
  ];

  const pastSessions = [
    { id: 6, title: "Tango Dancing", partner: mockUsers[2], date: "Dec 1, 2024", type: "Learning", completed: true },
    { id: 7, title: "Photography Basics", partner: mockUsers[3], date: "Nov 28, 2024", type: "Teaching", completed: true },
  ];

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">My Schedule</h1>
          <p className="text-muted-foreground">View and manage all your upcoming skill exchange sessions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={session.partner.avatar} alt={session.partner.name} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <h3 className="font-semibold">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">with {session.partner.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{session.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.time}</span>
                          <span className="flex items-center gap-1"><Video className="h-3 w-3" />{session.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={session.type === "Teaching" ? "bg-terracotta/10 text-terracotta border-0" : "bg-teal/10 text-teal border-0"}>
                        {session.type}
                      </Badge>
                      <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Past Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pastSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-4">
                      <img src={session.partner.avatar} alt={session.partner.name} className="h-10 w-10 rounded-full object-cover opacity-75" />
                      <div>
                        <h3 className="font-medium text-muted-foreground">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">with {session.partner.name} • {session.date}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground">Completed</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-terracotta/10">
                    <p className="text-2xl font-bold text-terracotta">3</p>
                    <p className="text-sm text-muted-foreground">Teaching</p>
                  </div>
                  <div className="p-4 rounded-lg bg-teal/10">
                    <p className="text-2xl font-bold text-teal">2</p>
                    <p className="text-sm text-muted-foreground">Learning</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="terracotta" className="w-full">Schedule New Session</Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/swaps">View All Swaps</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;