"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trophy,
  BookOpen,
  Target,
  TrendingUp,
  User,
  Star,
  Flame,
  Award,
  Calendar,
  Zap
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Charts
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";


const ProfilePage = () => {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    achievementsEarned: 0,
    totalAchievements: 0,
  });
  const [activityData, setActivityData] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      
      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push('/auth');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setDisplayName(data.profile.display_name || "");
        setAvatarUrl(data.profile.avatar_url || "");
        setStats(data.stats);
        setAchievements(data.achievements || []);
        setActivityData(data.activity || []);
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }

    } catch (error) {
      toast.error(error.message || "Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.success) {
        toast.success("Profile updated successfully! 🎉");
        setProfile(data.profile);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            Loading your awesome profile... ✨
          </p>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">Please login to view your profile</p>
          <Button onClick={() => router.push('/auth')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Calculations
  const progressPercent = stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  const earnedAchievements = achievements.filter(a => a.earned);
  const unearnedAchievements = achievements.filter(a => !a.earned);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-8 group hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Learning Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your progress, achievements, and learning journey
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid grid-cols-3 lg:w-1/3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Profile Card */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="w-6 h-6 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-lg">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-purple-600 text-white">
                        {displayName?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Badge variant="outline" className="text-sm">
                        Member since {formatDate(profile.created_at)}
                      </Badge>
                    </div>
                  </div>

                  {/* Form Section */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Username
                        </Label>
                        <Input value={profile.username} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Display Name
                        </Label>
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <img src="/avatar-icon.svg" className="w-4 h-4" alt="" />
                        Avatar URL
                      </Label>
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/your-avatar.jpg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <img src="/email-icon.svg" className="w-4 h-4" alt="" />
                        Email
                      </Label>
                      <Input value={profile.email} disabled className="bg-muted" />
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving Changes..." : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:scale-[1.02] transition-transform duration-300 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Total XP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{profile.total_xp.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-2">Experience points earned</p>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-transform duration-300 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.completedLessons}/{stats.totalLessons}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Lessons completed</p>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-transform duration-300 border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{profile.current_streak} days</div>
                  <p className="text-sm text-muted-foreground mt-2">Current learning streak</p>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-transform duration-300 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.achievementsEarned}/{stats.totalAchievements}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Achievements unlocked</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-8">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Learning Progress
                </CardTitle>
                <CardDescription>
                  Your overall learning journey and completion rate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Course Completion</span>
                    <span className="font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Completed Lessons</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedLessons}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Remaining Lessons</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalLessons - stats.completedLessons}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Daily XP Earned
                  </CardTitle>
                  <CardDescription>Last 7 days of activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="xp" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Lessons Completed
                  </CardTitle>
                  <CardDescription>Last 7 days of activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                          }}
                        />
                        <Bar 
                          dataKey="lessons" 
                          fill="hsl(var(--green-600))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Streak Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Learning Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{profile.current_streak} days</p>
                    <p className="text-muted-foreground">Current streak</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{profile.longest_streak} days</p>
                    <p className="text-muted-foreground">Longest streak</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Last active: {formatDate(profile.last_activity_date || profile.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Your Achievements
                </CardTitle>
                <CardDescription>
                  {stats.achievementsEarned} of {stats.totalAchievements} achievements unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Earned Achievements */}
                {earnedAchievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Unlocked Achievements ({earnedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {earnedAchievements.map((achievement) => (
                        <Card key={achievement.id} className="border-green-500/20 bg-green-500/5">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-green-500/10 p-3 rounded-lg">
                                <Trophy className="w-6 h-6 text-green-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{achievement.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                                {achievement.earned_at && (
                                  <p className="text-xs text-green-600 mt-2">
                                    Earned on {formatDate(achievement.earned_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-8" />

                {/* Unearned Achievements */}
                {unearnedAchievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Available Achievements ({unearnedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unearnedAchievements.map((achievement) => (
                        <Card key={achievement.id} className="opacity-60">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-muted p-3 rounded-lg">
                                <Target className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{achievement.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                                <p className="text-xs text-orange-600 mt-2">
                                  {achievement.requirement_type}: {achievement.requirement_value}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;

// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Progress } from "@/components/ui/progress";
// import { toast } from "sonner";
// import { ArrowLeft, Save, Trophy, BookOpen, Target, TrendingUp } from "lucide-react";
// import { AchievementBadge } from "@/components/AchievementBadge";
// import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
// import { useRouter } from "next/navigation";

// const Profile = () => {
//   const navigate = useRouter();
//   const [profile, setProfile] = useState(null);
//   const [displayName, setDisplayName] = useState("");
//   const [avatarUrl, setAvatarUrl] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [stats, setStats] = useState({
//     totalLessons: 0,
//     completedLessons: 0,
//     achievementsEarned: 0,
//     totalAchievements: 0,
//   });
//   const [activityData, setActivityData] = useState([]);
//   const [achievements, setAchievements] = useState([]);
//   const [userAchievements, setUserAchievements] = useState([]);
//   useEffect(() => {
//     fetchData();
//   }, []);
//   const fetchData = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         navigate.push("/auth");
//         return;
//       }
//       // Fetch profile
//       const { data: profileData } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("id", user.id)
//         .single();
//       if (profileData) {
//         setProfile(profileData);
//         setDisplayName(profileData.display_name || "");
//         setAvatarUrl(profileData.avatar_url || "");
//       }
//       // Fetch stats
//       const [lessonsResult, progressResult, achievementsResult, userAchievementsResult, activityResult] = await Promise.all([
//         supabase.from("lessons").select("id"),
//         supabase.from("user_progress").select("lesson_id").eq("user_id", user.id).eq("completed", true),
//         supabase.from("achievements").select("*"),
//         supabase.from("user_achievements").select("*").eq("user_id", user.id),
//         supabase.from("user_activity").select("*").eq("user_id", user.id).order("activity_date", { ascending: true }).limit(7),
//       ]);
//       setStats({
//         totalLessons: lessonsResult.data?.length || 0,
//         completedLessons: progressResult.data?.length || 0,
//         achievementsEarned: userAchievementsResult.data?.length || 0,
//         totalAchievements: achievementsResult.data?.length || 0,
//       });
//       if (achievementsResult.data) setAchievements(achievementsResult.data);
//       if (userAchievementsResult.data) setUserAchievements(userAchievementsResult.data);
     
//       if (activityResult.data) {
//         const formattedData = activityResult.data.map((activity) => ({
//           date: new Date(activity.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//           xp: activity.xp_earned || 0,
//           lessons: activity.lessons_completed || 0,
//         }));
//         setActivityData(formattedData);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleSaveProfile = async () => {
//     setSaving(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;
//       const { error } = await supabase
//         .from("profiles")
//         .update({
//           display_name: displayName,
//           avatar_url: avatarUrl,
//         })
//         .eq("id", user.id);
//       if (error) throw error;
//       toast.success("Profile updated successfully! 🎉");
//       fetchData();
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setSaving(false);
//     }
//   };
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-lg animate-bounce-in">Loading your awesome profile... ✨</div>
//       </div>
//     );
//   }
//   const progressPercent = stats.totalLessons > 0
//     ? (stats.completedLessons / stats.totalLessons) * 100
//     : 0;
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
//       <div className="container max-w-6xl mx-auto px-4 py-8">
//         <div className="animate-fade-in">
//           <Button
//             variant="ghost"
//             onClick={() => navigate.push("/dashboard")}
//             className="mb-4 hover:scale-105 transition-transform"
//           >
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Dashboard
//           </Button>
//           <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
//             Your Profile 👤
//           </h1>
//           <p className="text-muted-foreground mb-8">Manage your info and track your progress</p>
//           {/* Profile Edit Section */}
//           <Card className="mb-8 hover:shadow-lg transition-all animate-scale-in border-2">
//             <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
//               <CardTitle className="flex items-center gap-2">
//                 <span className="text-2xl">✏️</span> Edit Profile
//               </CardTitle>
//               <CardDescription className="text-primary-foreground/90">
//                 Update your display name and avatar
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pt-6">
//               <div className="flex flex-col md:flex-row gap-6 items-start">
//                 <div className="flex flex-col items-center gap-4">
//                   <Avatar className="w-32 h-32 ring-4 ring-primary/20 hover:ring-primary/40 transition-all animate-bounce-in">
//                     <AvatarImage src={avatarUrl} />
//                     <AvatarFallback className="text-4xl bg-gradient-primary text-primary-foreground">
//                       {displayName?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?"}
//                     </AvatarFallback>
//                   </Avatar>
//                 </div>
//                 <div className="flex-1 space-y-4">
//                   <div>
//                     <Label htmlFor="username" className="text-sm font-semibold">Username (cannot be changed)</Label>
//                     <Input
//                       id="username"
//                       value={profile?.username || ""}
//                       disabled
//                       className="bg-muted"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="displayName" className="text-sm font-semibold">Display Name ✨</Label>
//                     <Input
//                       id="displayName"
//                       value={displayName}
//                       onChange={(e) => setDisplayName(e.target.value)}
//                       placeholder="Your awesome name"
//                       className="hover:border-primary transition-colors"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="avatarUrl" className="text-sm font-semibold">Avatar URL 🖼️</Label>
//                     <Input
//                       id="avatarUrl"
//                       value={avatarUrl}
//                       onChange={(e) => setAvatarUrl(e.target.value)}
//                       placeholder="https://example.com/avatar.jpg"
//                       className="hover:border-primary transition-colors"
//                     />
//                   </div>
//                   <Button
//                     onClick={handleSaveProfile}
//                     disabled={saving}
//                     className="w-full hover:scale-105 transition-transform bg-gradient-primary"
//                   >
//                     <Save className="w-4 h-4 mr-2" />
//                     {saving ? "Saving... 💾" : "Save Changes 🚀"}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//           {/* Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//             <Card className="hover:scale-105 transition-transform animate-fade-in border-2 hover:border-primary/50">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium flex items-center gap-2">
//                   <Trophy className="w-4 h-4 text-accent" />
//                   Total XP
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-primary">{profile?.total_xp || 0} 🌟</div>
//               </CardContent>
//             </Card>
//             <Card className="hover:scale-105 transition-transform animate-fade-in border-2 hover:border-success/50" style={{ animationDelay: '0.1s' }}>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium flex items-center gap-2">
//                   <BookOpen className="w-4 h-4 text-success" />
//                   Lessons Completed
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-success">
//                   {stats.completedLessons}/{stats.totalLessons} 📚
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="hover:scale-105 transition-transform animate-fade-in border-2 hover:border-secondary/50" style={{ animationDelay: '0.2s' }}>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium flex items-center gap-2">
//                   <Target className="w-4 h-4 text-secondary" />
//                   Current Streak
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-secondary">
//                   {profile?.current_streak || 0} 🔥
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className="hover:scale-105 transition-transform animate-fade-in border-2 hover:border-accent/50" style={{ animationDelay: '0.3s' }}>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm font-medium flex items-center gap-2">
//                   <Trophy className="w-4 h-4 text-accent" />
//                   Achievements
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-accent">
//                   {stats.achievementsEarned}/{stats.totalAchievements} 🏆
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//           {/* Progress Overview */}
//           <Card className="mb-8 animate-scale-in border-2">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <TrendingUp className="w-5 h-5 text-primary" />
//                 Learning Progress 📈
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="font-medium">Overall Completion</span>
//                   <span className="font-bold text-primary">{Math.round(progressPercent)}% 🎯</span>
//                 </div>
//                 <Progress value={progressPercent} className="h-4 animate-pulse-glow" />
//               </div>
//             </CardContent>
//           </Card>
//           {/* Activity Charts */}
//           {activityData.length > 0 && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               <Card className="animate-fade-in border-2">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <span className="text-xl">📊</span> XP Earned (Last 7 Days)
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ChartContainer config={{ xp: { label: "XP", color: "hsl(var(--primary))" } }}>
//                     <ResponsiveContainer width="100%" height={200}>
//                       <LineChart data={activityData}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//                         <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
//                         <YAxis stroke="hsl(var(--muted-foreground))" />
//                         <ChartTooltip content={<ChartTooltipContent />} />
//                         <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={3} />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </ChartContainer>
//                 </CardContent>
//               </Card>
//               <Card className="animate-fade-in border-2" style={{ animationDelay: '0.1s' }}>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <span className="text-xl">📚</span> Lessons Completed (Last 7 Days)
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ChartContainer config={{ lessons: { label: "Lessons", color: "hsl(var(--success))" } }}>
//                     <ResponsiveContainer width="100%" height={200}>
//                       <BarChart data={activityData}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//                         <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
//                         <YAxis stroke="hsl(var(--muted-foreground))" />
//                         <ChartTooltip content={<ChartTooltipContent />} />
//                         <Bar dataKey="lessons" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </ChartContainer>
//                 </CardContent>
//               </Card>
//             </div>
//           )}
//           {/* Achievements */}
//           <Card className="animate-scale-in border-2">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Trophy className="w-5 h-5 text-accent" />
//                 Your Achievements 🏆
//               </CardTitle>
//               <CardDescription>
//                 {stats.achievementsEarned} of {stats.totalAchievements} earned - Keep going! 💪
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {achievements.map((achievement) => {
//                   const earned = userAchievements.find(
//                     (ua) => ua.achievement_id === achievement.id
//                   );
//                   return (
//                     <div key={achievement.id} className="animate-bounce-in hover:scale-105 transition-transform">
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
// export default Profile;