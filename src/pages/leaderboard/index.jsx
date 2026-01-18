"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

const Leaderboard = () => {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    averageXP: 0,
    topXP: 0,
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
        
        // Calculate some stats
        if (data.leaderboard?.length > 0) {
          const totalXP = data.leaderboard.reduce((sum, user) => sum + user.total_xp, 0);
          const topXP = data.leaderboard[0]?.total_xp || 0;
          
          setStats({
            totalUsers: data.leaderboard.length,
            averageXP: Math.round(totalXP / data.leaderboard.length),
            topXP: topXP,
          });
        }
      } else {
        throw new Error(data.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      toast.error(error.message || "Failed to load leaderboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold">
          {rank}
        </div>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-700 to-amber-800 text-white";
      default:
        return rank <= 10 
          ? "bg-primary/20 text-primary" 
          : "bg-muted text-muted-foreground";
    }
  };

  const getXPPercentage = (xp) => {
    if (stats.topXP === 0) return 0;
    return Math.min((xp / stats.topXP) * 100, 100);
  };

  const formatXP = (xp) => {
    return xp.toLocaleString();
  };

  const refreshLeaderboard = () => {
    fetchLeaderboard();
    toast.success("Leaderboard refreshed!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            Loading leaderboard... 🏆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <div className="container max-w-6xl mx-auto px-4 py-8">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Compete with learners from around the world
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:scale-[1.02] transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average XP</p>
                  <p className="text-3xl font-bold">{formatXP(stats.averageXP)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Score</p>
                  <p className="text-3xl font-bold">{formatXP(stats.topXP)}</p>
                </div>
                <Crown className="w-10 h-10 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current User Card - Only show if logged in */}
        {currentUser && (
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Your Ranking
              </CardTitle>
              <CardDescription>
                See how you stack up against other learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Badge className={`text-lg px-4 py-2 ${getRankBadgeColor(currentUser.rank)}`}>
                    #{currentUser.rank}
                  </Badge>
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback className="text-xl">
                      {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {currentUser.display_name || currentUser.username}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentUser.current_streak} day streak • {currentUser.longest_streak} longest
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatXP(currentUser.total_xp)} XP
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentUser.rank <= 3 ? "Top Performer!" : `Top ${Math.ceil((currentUser.rank / (stats.totalUsers || 1)) * 100)}%`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard List */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Learners</CardTitle>
                <CardDescription>
                  Ranked by total experience points
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={refreshLeaderboard}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {leaderboard.map((entry) => {
                const xpPercentage = getXPPercentage(entry.total_xp);
                const isCurrentUser = currentUser?.id === entry.id;
                
                return (
                  <div
                    key={entry.id}
                    className={`p-4 transition-all hover:bg-muted/50 ${
                      isCurrentUser ? "bg-primary/5 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                          {entry.display_name?.[0]?.toUpperCase() || entry.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {entry.display_name || entry.username}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                          </h3>
                          {entry.rank <= 3 && (
                            <Badge variant="secondary" className="text-xs">
                              {entry.rank === 1 ? "Champion" : entry.rank === 2 ? "Runner-up" : "Bronze"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{entry.username} • {entry.current_streak} day streak
                        </p>
                        
                        {/* XP Progress Bar */}
                        <div className="mt-2 max-w-md">
                          <div className="flex justify-between text-xs mb-1">
                            <span>0 XP</span>
                            <span className="font-medium">{formatXP(entry.total_xp)} XP</span>
                            <span>{formatXP(stats.topXP)} XP</span>
                          </div>
                          <Progress value={xpPercentage} className="h-2" />
                        </div>
                      </div>

                      {/* XP Score */}
                      <div className="text-right min-w-[100px]">
                        <div className="text-2xl font-bold text-primary">
                          {formatXP(entry.total_xp)}
                        </div>
                        <div className="text-sm text-muted-foreground">XP</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {leaderboard.length === 0 && (
              <div className="py-16 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No learners yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to start learning and appear on the leaderboard!
                </p>
                <Button onClick={() => router.push("/lessons")}>
                  Start Learning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Leaderboard updates every hour • Earn XP by completing lessons and maintaining streaks
          </p>
          <p className="mt-2">
            <Button variant="link" onClick={fetchLeaderboard} className="text-sm">
              Last updated: Just now
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";

// const Leaderboard = () => {
//   const navigate = useRouter();
//   const [leaderboard, setLeaderboard] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchLeaderboard();
//   }, []);

//   const fetchLeaderboard = async () => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       const { data: profilesData } = await supabase
//         .from("profiles")
//         .select("id, username, total_xp, current_streak")
//         .order("total_xp", { ascending: false })
//         .limit(50);

//       if (profilesData) {
//         const rankedData = profilesData.map((profile, index) => ({
//           ...profile,
//           rank: index + 1,
//         }));

//         setLeaderboard(rankedData);

//         if (user) {
//           const userEntry = rankedData.find((p) => p.id === user.id);
//           if (userEntry) {
//             setCurrentUser(userEntry);
//           }
//         }
//       }
//     } catch (error) {
//       toast.error(error.message || "Failed to load leaderboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getRankIcon = (rank) => {
//     switch (rank) {
//       case 1:
//         return <Trophy className="w-6 h-6 text-accent" />;
//       case 2:
//         return <Medal className="w-6 h-6 text-muted-foreground" />;
//       case 3:
//         return <Award className="w-6 h-6 text-secondary" />;
//       default:
//         return null;
//     }
//   };

//   const getRankBadgeColor = (rank) => {
//     switch (rank) {
//       case 1:
//         return "bg-accent text-accent-foreground";
//       case 2:
//         return "bg-muted-foreground text-white";
//       case 3:
//         return "bg-secondary text-secondary-foreground";
//       default:
//         return "bg-muted";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-lg">Loading leaderboard...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-muted">
//       <div className="container max-w-4xl mx-auto px-4 py-8">
//         <Button
//           variant="ghost"
//           onClick={() => navigate.push("/dashboard")}
//           className="mb-4"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Back to Dashboard
//         </Button>

//         <Card className="mb-8 bg-gradient-hero text-white border-0">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               <Trophy className="w-16 h-16" />
//             </div>
//             <CardTitle className="text-3xl font-bold">
//               Global Leaderboard
//             </CardTitle>
//             <CardDescription className="text-white/80">
//               Compete with learners around the world
//             </CardDescription>
//           </CardHeader>
//         </Card>

//         {/* Current User Card */}
//         {currentUser && (
//           <Card className="mb-6 border-primary border-2">
//             <CardHeader>
//               <CardTitle className="text-lg">Your Ranking</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-4">
//                   <Badge className={getRankBadgeColor(currentUser.rank || 0)}>
//                     #{currentUser.rank}
//                   </Badge>
//                   <Avatar>
//                     <AvatarFallback className="bg-primary text-primary-foreground">
//                       {currentUser.username.substring(0, 2).toUpperCase()}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <div className="font-semibold">{currentUser.username}</div>
//                     <div className="text-sm text-muted-foreground">
//                       {currentUser.current_streak} day streak
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold">{currentUser.total_xp}</div>
//                   <div className="text-sm text-muted-foreground">XP</div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Leaderboard List */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Top Learners</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {leaderboard.map((entry) => (
//               <div
//                 key={entry.id}
//                 className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
//                   entry.id === currentUser?.id
//                     ? "bg-primary/10 border border-primary"
//                     : "bg-muted hover:bg-muted/80"
//                 }`}
//               >
//                 <div className="flex items-center gap-4 flex-1">
//                   <div className="flex items-center gap-2 min-w-[80px]">
//                     {getRankIcon(entry.rank || 0)}
//                     <Badge
//                       variant="outline"
//                       className={
//                         entry.rank && entry.rank <= 3
//                           ? getRankBadgeColor(entry.rank)
//                           : ""
//                       }
//                     >
//                       #{entry.rank}
//                     </Badge>
//                   </div>
//                   <Avatar>
//                     <AvatarFallback className="bg-primary text-primary-foreground">
//                       {entry.username.substring(0, 2).toUpperCase()}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className="flex-1">
//                     <div className="font-semibold">{entry.username}</div>
//                     <div className="text-sm text-muted-foreground">
//                       {entry.current_streak} day streak
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-xl font-bold">{entry.total_xp}</div>
//                   <div className="text-sm text-muted-foreground">XP</div>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;