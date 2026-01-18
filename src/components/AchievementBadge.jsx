import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export const AchievementBadge = ({ achievement }) => {
  return (
    <Card
      className={`p-4 transition-all hover:scale-105 ${
        achievement.earned
          ? "bg-gradient-primary border-primary/50 animate-pulse-glow"
          : "opacity-50 grayscale"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-4xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="font-bold">{achievement.name}</div>
          <div className="text-sm text-muted-foreground">{achievement.description}</div>
          {achievement.earned && achievement.earned_at && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Earned {new Date(achievement.earned_at).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
