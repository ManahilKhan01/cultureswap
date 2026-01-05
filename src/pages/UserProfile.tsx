import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Calendar, Globe, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockUsers, mockReviews } from "@/data/mockData";

const UserProfile = () => {
  const { id } = useParams();
  const user = mockUsers.find(u => u.id === id);
  const userReviews = mockReviews.filter(r => r.reviewer.id !== id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">User Not Found</h1>
          <Button asChild><Link to="/discover">Back to Discover</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/discover"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <img src={user.avatar} alt={user.name} className="h-32 w-32 rounded-full object-cover mx-auto ring-4 ring-terracotta/20" />
                <h1 className="font-display text-2xl font-bold mt-4">{user.name}</h1>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />{user.location}, {user.country}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="h-5 w-5 fill-golden text-golden" />
                  <span className="font-semibold">{user.rating}</span>
                  <span className="text-muted-foreground">({user.reviewCount} reviews)</span>
                </div>
                <Button variant="terracotta" className="w-full mt-4" asChild>
                  <Link to={`/messages?user=${user.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />Send Message
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{user.languages.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{user.timezone} • {user.availability}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Badges</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {user.badges.map(badge => (
                  <Badge key={badge.id} variant="secondary" className="text-sm py-1 px-3">
                    <span className="mr-1">{badge.icon}</span>{badge.name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{user.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Skills Offered</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {user.skillsOffered.map(skill => (
                  <Badge key={skill} className="bg-terracotta/10 text-terracotta border-terracotta/30">{skill}</Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Skills Wanted</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {user.skillsWanted.map(skill => (
                  <Badge key={skill} className="bg-teal/10 text-teal border-teal/30">{skill}</Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Stats</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-terracotta">{user.swapsCompleted}</p>
                  <p className="text-sm text-muted-foreground">Swaps Completed</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-teal">{user.reviewCount}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-golden">{user.rating}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
