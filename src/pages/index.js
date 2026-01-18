import { useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { BookOpen, Zap, Trophy, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

const Index = () => {
  const router = useRouter()

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center bg-white rounded-full p-4 mb-6 shadow-glow">
            <BookOpen className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Learn Hausa, Have Fun!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Master the Hausa language through interactive lessons, earn rewards, and compete with learners worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/auth")}
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              Start Learning Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth")}
              className="text-lg px-8 py-6 bg-white/10 text-white border-white hover:bg-white/20 backdrop-blur-sm"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Interactive Lessons</h3>
              <p className="text-muted-foreground">
                Learn through engaging multiple-choice, translation, and audio exercises
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-secondary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
              <p className="text-muted-foreground">
                Gain XP points, track your progress, and climb the global leaderboard
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Build Streaks</h3>
              <p className="text-muted-foreground">
                Maintain daily learning streaks and develop consistent study habits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl max-w-2xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Join thousands of learners mastering Hausa today
              </p>
              <Button
                size="lg"
                onClick={() => router.push("/auth")}
                className="text-lg px-8 py-6"
              >
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
