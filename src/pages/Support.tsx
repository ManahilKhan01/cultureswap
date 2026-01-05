import { Search, HelpCircle, MessageCircle, FileText, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Support = () => {
  const categories = [
    { icon: HelpCircle, title: "Getting Started", desc: "Learn the basics of CultureSwap" },
    { icon: MessageCircle, title: "Communication", desc: "Messaging and video calls" },
    { icon: FileText, title: "Account & Billing", desc: "Manage your account" },
    { icon: Shield, title: "Safety & Trust", desc: "Stay safe while swapping" },
  ];

  const faqs = [
    { q: "How do I create my first skill swap?", a: "Go to your dashboard and click 'Create Swap'. Fill in the skills you offer and want to learn, then publish it to start matching." },
    { q: "Is CultureSwap free to use?", a: "Yes! CultureSwap is completely free. We believe in accessible skill exchange for everyone." },
    { q: "How does the matching algorithm work?", a: "Our AI analyzes your skills, interests, and preferences to find compatible partners with complementary skills." },
    { q: "Can I exchange skills in person?", a: "Yes, you can choose online, in-person, or both formats when creating your swap listing." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={false} />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">How can we help?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search for help..." className="pl-12 h-14 text-lg" />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {categories.map((cat) => (
            <Card key={cat.title} className="hover-lift cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
                  <cat.icon className="h-6 w-6 text-terracotta" />
                </div>
                <h3 className="font-semibold mb-1">{cat.title}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-6">
                <AccordionTrigger className="hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;