"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { LogOut, Trophy, BookOpen, Shield } from "lucide-react";
import { toast } from "sonner";
import { StreakCounter } from "../../components/StreakCounter";
import { AchievementBadge } from "../../components/AchievementBadge";
import { WavingHand } from "../../components/WavingHand";
import { Sparkles } from "../../components/Sparkles";

const Dashboard = () => {
  const router = useRouter();
  const navigate = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();

  const [lessons, setLessons] = useState([]);
  const [profile, setProfile] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate.replace("/auth");
      } else {
        fetchData();
      }
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();

      setProfile(data.user);
      setLessons(data.lessons || []);
      setCompletedLessons(new Set(data.completedLessons || []));
      setAchievements(data.achievements || []);
      setUserAchievements(data.userAchievements || []);
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      toast.error(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-success";
      case "intermediate":
        return "bg-secondary";
      case "advanced":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;
  const progressPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const handleSignOut = async () => {
    await logout();
    navigate.replace("/auth");
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 relative">
              <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center">
                Welcome back, {profile?.username}! <WavingHand />
              </h2>
              <Sparkles
                count={8}
                size={18}
                style={{ top: -10, left: 0, width: "100%", height: 30 }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/profile")}
                className="hover:scale-105 transition-transform hover:border-primary"
              >
                <Avatar className="w-4 h-4 mr-2">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {profile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                Profile
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin")}
                  className="hover:scale-105 transition-transform hover:border-secondary"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => router.push("/leaderboard")}
                className="hover:scale-105 transition-transform hover:border-accent"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>

              <Button
                variant="outline"
                onClick={handleSignOut}
                className="hover:scale-105 transition-transform"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="mb-8">
            <StreakCounter
              currentStreak={profile?.current_streak || 0}
              longestStreak={profile?.longest_streak || 0}
            />
          </div>

          {/* Progress Overview */}
          <Card className="mb-8 animate-scale-in border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">Chart</span> Your Progress
              </CardTitle>
              <CardDescription>
                {completedCount} of {totalLessons} lessons completed - Keep it
                up! Muscle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    Total XP: {profile?.total_xp || 0} Star
                  </span>
                  <span className="font-semibold text-primary">
                    {Math.round(progressPercent)}% Target
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-4 animate-pulse-glow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lessons Grid */}
          <Card className="mb-8 animate-scale-in border-2">
            <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">Books</span> Your Learning Path
              </CardTitle>
              <CardDescription className="text-primary-foreground/90">
                Continue your Hausa learning journey Rocket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  return (
                    <Card
                      key={lesson.id}
                      className={`hover:shadow-glow transition-all hover:scale-105 cursor-pointer border-2 animate-fade-in ${
                        isCompleted
                          ? "border-success bg-success/10"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => router.push(`/lesson/${lesson.id}`)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {lesson.title}
                            </CardTitle>
                            <CardDescription>
                              {lesson.description}
                            </CardDescription>
                          </div>
                          {isCompleted && (
                            <div className="animate-bounce-in">
                              <Trophy className="w-5 h-5 text-success" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div
                            className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(
                              lesson.difficulty
                            )}`}
                          >
                            {lesson.difficulty}
                          </div>
                          <div className="text-sm font-semibold text-primary">
                            +{lesson.xp_reward} XP
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="animate-scale-in border-2">
            <CardHeader className="bg-gradient-secondary text-secondary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">Trophy</span> Achievements
              </CardTitle>
              <CardDescription className="text-secondary-foreground/90">
                Your earned badges and milestones Party Popper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const earned = userAchievements.find(
                    (ua) => ua.achievement_id === achievement.id
                  );
                  return (
                    <div
                      key={achievement.id}
                      className="animate-bounce-in hover:scale-105 transition-transform"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <AchievementBadge
                        achievement={{
                          ...achievement,
                          earned: !!earned,
                          earned_at: earned?.earned_at,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



// import { useEffect, useState } from "react";
// import { supabase } from "../../integrations/supabase/client";
// import { Button } from "../../components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../../components/ui/card";
// import { Progress } from "../../components/ui/progress";
// import {
//   Avatar,
//   AvatarFallback,
//   AvatarImage,
// } from "../../components/ui/avatar";
// import { LogOut, Trophy, BookOpen, Shield } from "lucide-react";
// import { toast } from "sonner";
// import { StreakCounter } from "../../components/StreakCounter";
// import { AchievementBadge } from "../../components/AchievementBadge";
// import { WavingHand } from "../../components/WavingHand";
// import { Sparkles } from "../../components/Sparkles";
// import { Fire } from "@/components/Fire";
// import { useRouter } from "next/navigation";

// const Dashboard = () => {
//   const router = useRouter();
//   const navigate = useRouter();
//   const [lessons, setLessons] = useState([]);
//   const [profile, setProfile] = useState(null);
//   const [completedLessons, setCompletedLessons] = useState(new Set());
//   const [loading, setLoading] = useState(true);
//   const [achievements, setAchievements] = useState([]);
//   const [userAchievements, setUserAchievements] = useState([]);
//   const [isAdmin, setIsAdmin] = useState(false);

//   useEffect(() => {
//     checkAuth();
//     fetchData();
//   }, []);

//   const checkAuth = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();
//     if (!session) {
//       navigate.replace("/auth");
//     }
//   };

//   const fetchData = async () => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) return;

//       // Fetch profile
//       const { data: profileData } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("id", user.id)
//         .single();

//       if (profileData) setProfile(profileData);

//       // Fetch lessons
//       const { data: lessonsData } = await supabase
//         .from("lessons")
//         .select("*")
//         .order("order_index");

//       if (lessonsData) setLessons(lessonsData);

//       // Fetch completed lessons
//       const { data: progressData } = await supabase
//         .from("user_progress")
//         .select("lesson_id")
//         .eq("user_id", user.id)
//         .eq("completed", true);

//       if (progressData) {
//         setCompletedLessons(new Set(progressData.map((p) => p.lesson_id)));
//       }

//       // Check admin status
//       const { data: roles } = await supabase
//         .from("user_roles")
//         .select("role")
//         .eq("user_id", user.id)
//         .eq("role", "admin");

//       setIsAdmin(roles && roles.length > 0);

//       // Fetch achievements
//       const { data: achievementsData } = await supabase
//         .from("achievements")
//         .select("*");

//       if (achievementsData) setAchievements(achievementsData);

//       // Fetch user achievements
//       const { data: userAchievementsData } = await supabase
//         .from("user_achievements")
//         .select("*")
//         .eq("user_id", user.id);

//       if (userAchievementsData) setUserAchievements(userAchievementsData);

//       // Update streak
//       await updateStreak(user.id);
//     } catch (error) {
//       toast.error(error.message || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateStreak = async (userId) => {
//     try {
//       const { data: profileData } = await supabase
//         .from("profiles")
//         .select("last_activity_date, current_streak, longest_streak")
//         .eq("id", userId)
//         .single();

//       if (!profileData) return;

//       const today = new Date().toISOString().split("T")[0];
//       const lastActivity = profileData.last_activity_date;

//       let newStreak = profileData.current_streak || 0;
//       let newLongestStreak = profileData.longest_streak || 0;

//       if (lastActivity !== today) {
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayStr = yesterday.toISOString().split("T")[0];

//         if (lastActivity === yesterdayStr) {
//           newStreak += 1;
//         } else if (lastActivity) {
//           newStreak = 1;
//         } else {
//           newStreak = 1;
//         }

//         if (newStreak > newLongestStreak) {
//           newLongestStreak = newStreak;
//         }

//         await supabase
//           .from("profiles")
//           .update({
//             last_activity_date: today,
//             current_streak: newStreak,
//             longest_streak: newLongestStreak,
//           })
//           .eq("id", userId);

//         setProfile((prev) =>
//           prev
//             ? {
//                 ...prev,
//                 current_streak: newStreak,
//                 longest_streak: newLongestStreak,
//               }
//             : null
//         );
//       }
//     } catch (error) {
//       console.error("Error updating streak:", error);
//     }
//   };

//   const handleSignOut = async () => {
//     await supabase.auth.signOut();
//     navigate.replace("/auth");
//   };

//   const getDifficultyColor = (difficulty) => {
//     switch (difficulty) {
//       case "beginner":
//         return "bg-success";
//       case "intermediate":
//         return "bg-secondary";
//       case "advanced":
//         return "bg-destructive";
//       default:
//         return "bg-muted";
//     }
//   };

//   const totalLessons = lessons.length;
//   const completedCount = completedLessons.size;
//   const progressPercent =
//     totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-lg">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
//       <div className="container max-w-6xl mx-auto px-4 py-8">
//         <div className="animate-fade-in">
//           <div className="flex items-center justify-between mb-8">
//            <div className="flex items-center gap-4 relative">
//   <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center">
//     Welcome back, {profile?.username}! <WavingHand />
//   </h2>
//   {/* Sparkles over the welcome */}
//   <Sparkles count={8} size={18} style={{ top: -10, left: 0, width: "100%", height: 30 }} />
// </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 onClick={() => router.push("/profile")}
//                 className="hover:scale-105 transition-transform hover:border-primary"
//               >
//                 <Avatar className="w-4 h-4 mr-2">
//                   <AvatarFallback className="text-xs bg-primary text-primary-foreground">
//                     {profile?.username?.[0]?.toUpperCase()}
//                   </AvatarFallback>
//                 </Avatar>
//                 Profile
//               </Button>

//               {isAdmin && (
//                 <Button
//                   variant="outline"
//                   onClick={() => router.push("/admin")}
//                   className="hover:scale-105 transition-transform hover:border-secondary"
//                 >
//                   <Shield className="w-4 h-4 mr-2" />
//                   Admin
//                 </Button>
//               )}

//               <Button
//                 variant="outline"
//                 onClick={() => router.push("/leaderboard")}
//                 className="hover:scale-105 transition-transform hover:border-accent"
//               >
//                 <Trophy className="w-4 h-4 mr-2" />
//                 Leaderboard
//               </Button>

//               <Button
//                 variant="outline"
//                 onClick={handleSignOut}
//                 className="hover:scale-105 transition-transform"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Logout
//               </Button>
//             </div>
//           </div>

//           {/* Streak Counter */}
//           <div className="mb-8">
//             <StreakCounter
//               currentStreak={profile?.current_streak || 0}
//               longestStreak={profile?.longest_streak || 0}
//             />
//           </div>

//           {/* Progress Overview */}
//           <Card className="mb-8 animate-scale-in border-2">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <span className="text-2xl">Chart</span> Your Progress
//               </CardTitle>
//               <CardDescription>
//                 {completedCount} of {totalLessons} lessons completed - Keep it
//                 up! Muscle
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="font-medium">
//                     Total XP: {profile?.total_xp || 0} Star
//                   </span>
//                   <span className="font-semibold text-primary">
//                     {Math.round(progressPercent)}% Target
//                   </span>
//                 </div>
//                 <Progress value={progressPercent} className="h-4 animate-pulse-glow" />
//               </div>
//             </CardContent>
//           </Card>

//           {/* Lessons Grid */}
//           <Card className="mb-8 animate-scale-in border-2">
//             <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
//               <CardTitle className="flex items-center gap-2">
//                 <span className="text-2xl">Books</span> Your Learning Path
//               </CardTitle>
//               <CardDescription className="text-primary-foreground/90">
//                 Continue your Hausa learning journey Rocket
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {lessons.map((lesson, index) => {
//                   const isCompleted = completedLessons.has(lesson.id);
//                   return (
//                     <Card
//                       key={lesson.id}
//                       className={`hover:shadow-glow transition-all hover:scale-105 cursor-pointer border-2 animate-fade-in ${
//                         isCompleted
//                           ? "border-success bg-success/10"
//                           : "hover:border-primary/50"
//                       }`}
//                       onClick={() => router.push(`/lesson/${lesson.id}`)}
//                       style={{ animationDelay: `${index * 0.05}s` }}
//                     >
//                       <CardHeader>
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1">
//                             <CardTitle className="text-lg mb-2">
//                               {lesson.title}
//                             </CardTitle>
//                             <CardDescription>{lesson.description}</CardDescription>
//                           </div>
//                           {isCompleted && (
//                             <div className="animate-bounce-in">
//                               <Trophy className="w-5 h-5 text-success" />
//                             </div>
//                           )}
//                         </div>
//                       </CardHeader>
//                       <CardContent>
//                         <div className="flex items-center justify-between">
//                           <div
//                             className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(
//                               lesson.difficulty
//                             )}`}
//                           >
//                             {lesson.difficulty}
//                           </div>
//                           <div className="text-sm font-semibold text-primary">
//                             +{lesson.xp_reward} XP
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Achievements */}
//           <Card className="animate-scale-in border-2">
//             <CardHeader className="bg-gradient-secondary text-secondary-foreground rounded-t-lg">
//               <CardTitle className="flex items-center gap-2">
//                 <span className="text-2xl">Trophy</span> Achievements
//               </CardTitle>
//               <CardDescription className="text-secondary-foreground/90">
//                 Your earned badges and milestones Party Popper
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {achievements.map((achievement, index) => {
//                   const earned = userAchievements.find(
//                     (ua) => ua.achievement_id === achievement.id
//                   );
//                   return (
//                     <div
//                       key={achievement.id}
//                       className="animate-bounce-in hover:scale-105 transition-transform"
//                       style={{ animationDelay: `${index * 0.1}s` }}
//                     >
//                       <AchievementBadge
//                         achievement={{
//                           ...achievement,
//                           earned: !!earned,
//                           earned_at: earned?.earned_at,
//                         }}
//                       />
//                     </div>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;