import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fire } from "./Fire";
import { Sparkles } from "./Sparkles";

export const StreakCounter = ({ currentStreak, longestStreak }) => {
  return (
    <Card className="bg-gradient-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fire size={28} />
           <Sparkles count={6} size={14} style={{ top: -10, left: -10, width: 50, height: 50 }} />
          <span>Your Streak</span>
        </CardTitle>
        <CardDescription>Keep learning every day!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-muted-foreground">{longestStreak}</div>
            <div className="text-sm text-muted-foreground">Longest Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
