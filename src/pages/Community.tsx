import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Eye, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mockForumTopics, ForumTopic, currentUser } from "@/data/mockData";

const Community = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [topics, setTopics] = useState<ForumTopic[]>(mockForumTopics);

  const handleSubmit = () => {
    if (!title || !content || !category) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const newTopic: ForumTopic = {
      id: `f${Date.now()}`,
      title,
      author: currentUser,
      category:
        category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      replies: 0,
      views: 1,
      lastActivity: new Date().toISOString(),
      isPinned: false,
    };

    setTopics((prev) => [newTopic, ...prev]);
    toast({
      title: "Discussion Created",
      description: "Your discussion has been posted successfully!",
    });
    setIsOpen(false);
    setTitle("");
    setContent("");
    setCategory("");
  };

  return (
    <div className="bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Community Hub
            </h1>
            <p className="text-muted-foreground">
              Connect, share, and learn with fellow skill exchangers
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="terracotta">Start Discussion</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Start a New Discussion
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What's on your mind?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tips">Tips & Tricks</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="language-exchange">
                        Language Exchange
                      </SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="introductions">
                        Introductions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    rows={4}
                    placeholder="Share your thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <Button
                  variant="terracotta"
                  className="w-full"
                  onClick={handleSubmit}
                >
                  Post Discussion
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={topic.author.avatar}
                    alt={topic.author.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isPinned && (
                        <Pin className="h-4 w-4 text-terracotta" />
                      )}
                      <Link
                        to={`/community/${topic.id}`}
                        className="font-semibold text-lg hover:text-terracotta transition-colors"
                      >
                        {topic.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>by {topic.author.name}</span>
                      <Badge variant="secondary">{topic.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {topic.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {topic.views}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Community;
