// FILE: client/src/pages/landing.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Bell,
  Users,
  Mail,
  BarChart3,
  Shield,
  ArrowRight,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";
import { GigsterLogo } from "@/components/vsuite-logo";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { Link } from "wouter";
import { DemoSessionCreator } from "@/components/DemoSessionCreator";

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Smart Reminders",
      description: "24-hour and 1-hour advance notifications keep you on track",
      color: "text-yellow-600",
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email & SMS Alerts",
      description: "High-priority tasks trigger automatic notifications",
      color: "text-blue-900",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Multi-user support with admin controls and task assignment",
      color: "text-green-600",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Progress Tracking",
      description: "Add comments and track progress with detailed timestamps",
      color: "text-purple-600",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Project Organization",
      description: "Group tasks by projects for better workflow management",
      color: "text-red-600",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time Management",
      description: "Due dates with precise time tracking and status indicators",
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="gigster-hero-section py-20">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          {/* Logo and Branding */}
          <div className="flex justify-center mb-8 fade-in-up">
            <GigsterLogo size="large" showText={false} className="pulse-gigster" />
          </div>

          {/* 10-second clarity */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm text-white/90">
              Set up in 3 minutes • Get tailored next steps • Coach stays grounded in your business
            </span>
          </div>

          <h1
            className="text-5xl font-bold text-white mb-4 fade-in-up"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Run your gig or small business like a pro — without doing it alone.
          </h1>

          <p className="text-xl font-medium mb-6" style={{ color: "rgba(255, 181, 46, 0.95)" }}>
            A clean workspace + an AI coach that learns your context.
          </p>

          <p className="text-lg mb-10 max-w-3xl mx-auto" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
            Gigster Garage organizes your tasks, clients, projects, and money — then gives you clear,
            personalized "Next Actions" so you always know what to do next.
          </p>

          {/* Single unmistakable hero workflow */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/onboarding-wizard">
              <Button
                size="lg"
                className="bg-white font-semibold px-8 py-3 shadow-lg"
                style={{ color: "var(--garage-navy)", fontFamily: "var(--font-display)" }}
              >
                Start Quick Setup (3 minutes)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Reassurance + demo hint */}
          <div className="mt-5 text-sm" style={{ color: "rgba(255, 255, 255, 0.75)" }}>
            No fluff. No judgment. Just clear steps and real support.
          </div>

          <div className="mt-3 text-xs" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            Want to explore first? Use the demo credentials below: <span className="font-semibold">demo / demo123</span>
          </div>

          {/* Value bullets (tight, scannable) */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl bg-white/10 border border-white/15 p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white font-medium">Personalized workspace</span>
              </div>
              <p className="text-sm text-white/75">
                Quick setup captures your business stage, structure, and focus — then adapts the app.
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white font-medium">Next Actions that make sense</span>
              </div>
              <p className="text-sm text-white/75">
                Get 3–5 "do this next" steps with time estimates, based on your real context.
              </p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white font-medium">Coach that stays grounded</span>
              </div>
              <p className="text-sm text-white/75">
                Gigster Coach references your stage + pain points to give specific, useful guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Carousel Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--garage-navy)", fontFamily: "var(--font-display)" }}
            >
              See Gigster Garage in action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take a quick look at the workflow — then personalize your workspace in a 3-minute setup.
            </p>
          </div>

          <ScreenshotCarousel />

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 mb-4">Fast setup • No credit card required</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/onboarding-wizard">
                <Button size="lg" className="px-8">
                  Start Quick Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" size="lg" className="px-8">
                  Sign in (demo: demo / demo123)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #ecfdf5 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--garage-navy)", fontFamily: "var(--font-display)" }}
            >
              Everything you need to turn work into momentum
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--steel-gray)" }}>
              A clean system for tasks and projects — plus intelligent automation that keeps you moving
              without overwhelm.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="gigster-feature-card group"
                onClick={() => setActiveFeature(index)}
              >
                <CardHeader>
                  <div className={`${feature.color} mb-4 feature-icon transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Small reassurance strip */}
          <div className="mt-10 max-w-3xl mx-auto text-center text-sm text-gray-600">
            Start simple. Build confidence. Grow from there.
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Prefer to explore first?
          </h2>
          <p className="text-gray-600 mb-8">
            Use the demo account to click around — then run Quick Setup to personalize your coach and workspace.
          </p>

          <Card className="gigster-accent-section">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--garage-navy)" }}>
                    Demo Account
                  </h3>
                  <p className="mb-6" style={{ color: "var(--steel-gray)" }}>
                    Explore the core workflow with safe demo data. Perfect for a quick tour.
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center">
                      <Badge
                        style={{ backgroundColor: "var(--garage-navy)", color: "white" }}
                        className="mr-2"
                      >
                        Username
                      </Badge>
                      <code className="bg-white px-3 py-2 rounded shadow-sm border">demo</code>
                    </div>
                    <div className="flex items-center">
                      <Badge
                        style={{ backgroundColor: "var(--garage-navy)", color: "white" }}
                        className="mr-2"
                      >
                        Password
                      </Badge>
                      <code className="bg-white px-3 py-2 rounded shadow-sm border">demo123</code>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/login">
                      <Button className="px-6">
                        Sign in with demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/onboarding-wizard">
                      <Button variant="outline" className="px-6">
                        Run Quick Setup
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm" style={{ color: "var(--steel-gray)" }}>
                    <CheckCircle className="h-4 w-4 mr-2" style={{ color: "var(--garage-navy)" }} />
                    <span>Task + project workflow</span>
                  </div>
                  <div className="flex items-center text-sm" style={{ color: "var(--steel-gray)" }}>
                    <CheckCircle className="h-4 w-4 mr-2" style={{ color: "var(--garage-navy)" }} />
                    <span>Notifications + follow-ups</span>
                  </div>
                  <div className="flex items-center text-sm" style={{ color: "var(--steel-gray)" }}>
                    <CheckCircle className="h-4 w-4 mr-2" style={{ color: "var(--garage-navy)" }} />
                    <span>Invoice + proposal flow (demo)</span>
                  </div>
                  <div className="flex items-center text-sm" style={{ color: "var(--steel-gray)" }}>
                    <CheckCircle className="h-4 w-4 mr-2" style={{ color: "var(--garage-navy)" }} />
                    <span>Coach guidance powered by your profile</span>
                  </div>

                  {/* Keeps your existing session/demo mechanics */}
                  <DemoSessionCreator />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for a cleaner workflow?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start with Quick Setup — you'll get a personalized workspace and coach in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding-wizard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                Start Quick Setup
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Demo credentials: <span className="font-semibold">demo / demo123</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <img
                  src="@assets/IMG_3649_1755004491378.jpeg"
                  alt="Gigster Garage Logo"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <Shield className="text-white hidden" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-black">Gigster Garage</h3>
                <p className="text-sm text-gray-600">Simplified Workflow Hub</p>
              </div>
            </div>

            <div className="text-sm text-gray-500">© {new Date().getFullYear()} Gigster Garage. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
