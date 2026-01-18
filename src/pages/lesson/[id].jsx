"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { speak } from "@/utils/speechSynthesis";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const Lesson = () => {
  const params = useParams();
  const lessonId = params?.id;
  const navigate = useRouter();
      const {token} = useAuth();


  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState();
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      setCurrentQuestionIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const fetchLessonData = async () => {
    try {
      const res = await fetch(`/api/lesson/${lessonId}`);
      const data = await res.json();

      if (res.ok) {
        setLesson(data.lesson);
        setQuestions(data.questions || []);
        setProgressData(data.progress || null);

        // Set initial score if user already has progress
        if (data.progress?.score) setScore(Math.round((data.progress.score / 100) * (data.questions?.length || 1)));
      } else {
        toast.error(data.error || "Failed to load lesson");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = () => {
    const current = questions[currentQuestionIndex];
    const correct =
      selectedAnswer.toLowerCase().trim() ===
      current.correct_answer.toLowerCase().trim();

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(score + 1);

      // Sparkle confetti
      const count = 50;
      const defaults = {
        origin: { y: 0.7 },
        shapes: ["star"],
        colors: ["#FFD700", "#FFA500", "#FF6347"],
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    }
  };

  const handleNextQuestion = async () => {
    console.log(currentQuestionIndex < questions.length - 1)
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => (prev + 1))
      console.log(currentQuestionIndex)
      carouselApi?.scrollNext();
      setSelectedAnswer("");
      setShowResult(false);
    } else {
      await completeLesson();
    }
  };

  const completeLesson = async () => {
    try {

      console.log(`token: ${token}`, `lesson ${lesson}`)

      if (!token || !lesson) return;

      const finalScore = Math.round((score / questions.length) * 100);

      // Call API to upsert progress
      const res = await fetch(`/api/lesson/${lessonId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: finalScore }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Lesson completed! +${lesson.xp_reward} XP`);
        navigate.replace("/dashboard");
      } else {
        toast.error(data.error || "Failed to complete lesson");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate.push("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold mb-2">{lesson?.title}</h1>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {questions?.length}
              </span>
              <span>
                Score: {score}/{questions?.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }}>
          <CarouselContent>
            {questions.map((question, index) => (
              <CarouselItem key={question.id}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl">{question.question_text}</CardTitle>
                        {question.translation_hint && (
                          <CardDescription className="text-base">Hint: {question.translation_hint}</CardDescription>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => speak(question.question_text)}
                        className="shrink-0"
                        title="Pronounce"
                      >
                        <Volume2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {question.question_type === "multiple_choice" &&
                      question.options &&
                      index === currentQuestionIndex && (
                        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                          {question.options.map((option, i) => (
                            <div
                              key={i}
                              className={`flex items-center space-x-2 p-4 rounded-lg border transition-all duration-200 hover:bg-muted hover:scale-105 ${
                                showResult &&
                                option === question.correct_answer
                                  ? "bg-success/10 border-success animate-bounce-in"
                                  : showResult && option === selectedAnswer && !isCorrect
                                  ? "bg-destructive/10 border-destructive animate-shake"
                                  : ""
                              }`}
                            >
                              <RadioGroupItem value={option} id={`option-${i}`} />
                              <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                    {question.question_type === "translation" && index === currentQuestionIndex && (
                      <div className="space-y-2">
                        <Label htmlFor="answer">Your answer</Label>
                        <Input
                          id="answer"
                          value={selectedAnswer}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          disabled={showResult}
                          className="text-lg p-6"
                        />
                      </div>
                    )}

                    {showResult && index === currentQuestionIndex && (
                      <div
                        className={`p-6 rounded-lg flex items-center gap-3 ${
                          isCorrect
                            ? "bg-success/10 border-2 border-success animate-bounce-in"
                            : "bg-destructive/10 border-2 border-destructive animate-shake"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-8 h-8 text-success animate-scale-in" />
                            <div>
                              <div className="font-bold text-lg text-success">Correct!</div>
                              <div className="text-sm">Great job!</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-8 h-8 text-destructive animate-scale-in" />
                            <div>
                              <div className="font-bold text-lg text-destructive">Not quite</div>
                              <div className="text-sm">
                                The correct answer is: <span className="font-semibold">{question.correct_answer}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {index === currentQuestionIndex && (
                      <div className="flex gap-4">
                        {!showResult ? (
                          <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="w-full transition-all hover:scale-105" size="lg">
                            Check Answer
                          </Button>
                        ) : (
                          <Button onClick={handleNextQuestion} className="w-full transition-all hover:scale-105 animate-pulse-glow" size="lg">
                            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Complete Lesson"}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default Lesson;


// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { ArrowLeft, CheckCircle2, XCircle, Volume2 } from "lucide-react";
// import { toast } from "sonner";
// import confetti from "canvas-confetti";
// import { speak } from "@/utils/speechSynthesis";
// import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
// import { useParams, useRouter } from "next/navigation";

// const Lesson = () => {
//   const params = useParams();

//   const lessonId = params?.id;

//   const navigate = useRouter();
//   const [lesson, setLesson] = useState(null);
//   const [questions, setQuestions] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState("");
//   const [showResult, setShowResult] = useState(false);
//   const [isCorrect, setIsCorrect] = useState(false);
//   const [score, setScore] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [carouselApi, setCarouselApi] = useState();

//   useEffect(() => {
//     fetchLessonData();
//   }, [lessonId, params]);

//   useEffect(() => {
//     if (!carouselApi) return;

//     carouselApi.on("select", () => {
//       setCurrentQuestionIndex(carouselApi.selectedScrollSnap());
//     });
//   }, [carouselApi]);

//   const fetchLessonData = async () => {
//     try {
//       const { data: lessonData } = await supabase
//         .from("lessons")
//         .select("*")
//         .eq("id", lessonId)
//         .single();

//       if (lessonData) {
//         setLesson(lessonData);
//       }

//       const { data: questionsData } = await supabase
//         .from("questions")
//         .select("*")
//         .eq("lesson_id", lessonId)
//         .order("order_index");

//       if (questionsData) {
//         const parsed = questionsData.map((q) => ({
//           ...q,
//           options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
//         }));
//         setQuestions(parsed);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitAnswer = () => {
//     const current = questions[currentQuestionIndex];
//     const correct =
//       selectedAnswer.toLowerCase().trim() ===
//       current.correct_answer.toLowerCase().trim();

//     setIsCorrect(correct);
//     setShowResult(true);

//     if (correct) {
//       setScore(score + 1);

//       // Sparkle confetti
//       const count = 50;
//       const defaults = {
//         origin: { y: 0.7 },
//         shapes: ["star"],
//         colors: ["#FFD700", "#FFA500", "#FF6347"],
//       };

//       function fire(particleRatio, opts) {
//         confetti({
//           ...defaults,
//           ...opts,
//           particleCount: Math.floor(count * particleRatio),
//         });
//       }

//       fire(0.25, { spread: 26, startVelocity: 55 });
//       fire(0.2, { spread: 60 });
//       fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
//       fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
//     }
//   };

//   const handleNextQuestion = async () => {
//     if (currentQuestionIndex < questions.length - 1) {
//       carouselApi?.scrollNext();
//       setSelectedAnswer("");
//       setShowResult(false);
//     } else {
//       await completeLesson();
//     }
//   };

//   const checkAndAwardAchievements = async (userId) => {
//     try {
//       const { data: progressData } = await supabase
//         .from("user_progress")
//         .select("*")
//         .eq("user_id", userId)
//         .eq("completed", true);

//       const lessonsCompleted = progressData?.length || 0;
//       const perfectScores = progressData?.filter((p) => p.score === 100).length || 0;

//       const { data: profile } = await supabase
//         .from("profiles")
//         .select("total_xp, current_streak")
//         .eq("id", userId)
//         .single();

//       const totalXp = profile?.total_xp || 0;
//       const streakDays = profile?.current_streak || 0;

//       const { data: achievements } = await supabase.from("achievements").select("*");

//       if (!achievements) return;

//       for (const achievement of achievements) {
//         let earned = false;

//         switch (achievement.requirement_type) {
//           case "lessons_completed":
//             earned = lessonsCompleted >= achievement.requirement_value;
//             break;
//           case "perfect_scores":
//             earned = perfectScores >= achievement.requirement_value;
//             break;
//           case "streak_days":
//             earned = streakDays >= achievement.requirement_value;
//             break;
//           case "total_xp":
//             earned = totalXp >= achievement.requirement_value;
//             break;
//         }

//         if (earned) {
//           const { data: existing } = await supabase
//             .from("user_achievements")
//             .select("id")
//             .eq("user_id", userId)
//             .eq("achievement_id", achievement.id)
//             .maybeSingle();

//           if (!existing) {
//             await supabase.from("user_achievements").insert({
//               user_id: userId,
//               achievement_id: achievement.id,
//             });

//             toast.success(`🎉 Achievement unlocked: ${achievement.name}!`);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error checking achievements:", error);
//     }
//   };

//   const completeLesson = async () => {
//   try {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user || !lesson) return;

//     const finalScore = Math.round((score / questions.length) * 100);

//     // 1️⃣ CLEAN OLD DUPLICATES FIRST
//     await supabase.rpc("clean_user_progress_duplicates", {
//       _user_id: user.id,
//       _lesson_id: lessonId,
//     });

//     // 2️⃣ UPSERT PROGRESS (update timestamp + score, never duplicate)
//     await supabase
//       .from("user_progress")
//       .upsert(
//         {
//           user_id: user.id,
//           lesson_id: lessonId,
//           completed: true,
//           score: finalScore,
//           completed_at: new Date().toISOString(),
//         },
//         { onConflict: "user_id,lesson_id" }
//       );

//     // 3️⃣ UPDATE TOTAL XP
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("total_xp")
//       .eq("id", user.id)
//       .single();

//     if (profile) {
//       await supabase
//         .from("profiles")
//         .update({
//           total_xp: Number(profile.total_xp || 0) + lesson.xp_reward,
//         })
//         .eq("id", user.id);
//     }

//     // 4️⃣ UPDATE DAILY ACTIVITY / STREAK
//     const today = new Date().toISOString().split("T")[0];
//     await supabase.from("user_activity").upsert(
//       {
//         user_id: user.id,
//         activity_date: today,
//         xp_earned: lesson.xp_reward,
//         lessons_completed: 1,
//       },
//       { onConflict: "user_id,activity_date" }
//     );

//     // 5️⃣ CHECK ACHIEVEMENTS
//     await checkAndAwardAchievements(user.id);

//     // 6️⃣ FIREWORKS + NAVIGATION
//     const duration = 3000;
//     const animationEnd = Date.now() + duration;
//     const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

//     function randomInRange(min, max) {
//       return Math.random() * (max - min) + min;
//     }

//     await new Promise((resolve) => {
//       const interval = setInterval(() => {
//         const timeLeft = animationEnd - Date.now();
//         if (timeLeft <= 0) {
//           clearInterval(interval);
//           resolve();
//           return;
//         }

//         const particleCount = 50 * (timeLeft / duration);
//         confetti({
//           ...defaults,
//           particleCount,
//           origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
//           colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d"],
//         });
//         confetti({
//           ...defaults,
//           particleCount,
//           origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
//           colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d"],
//         });
//       }, 250);
//     });

//     toast.success(`Lesson completed! +${lesson.xp_reward} XP`);
//     navigate.replace("/dashboard"); // ✅ Next.js navigation
//   } catch (error) {
//     toast.error(error.message);
//   }
// };


//   const currentQuestion = questions[currentQuestionIndex];
//   const progress =
//     ((currentQuestionIndex + 1) / questions.length) * 100;

//   return (
//     <div className="min-h-screen bg-muted">
//       <div className="container max-w-3xl mx-auto px-4 py-8">
//         <div className="mb-8">
//           <Button
//             variant="ghost"
//             onClick={() => navigate.push("/dashboard")}
//             className="mb-4"
//           >
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Dashboard
//           </Button>

//           <h1 className="text-3xl font-bold mb-2">{lesson?.title}</h1>

//           <div className="space-y-2">
//             <div className="flex justify-between text-sm text-muted-foreground">
//               <span>
//                 Question {currentQuestionIndex + 1} of {questions?.length}
//               </span>
//               <span>
//                 Score: {score}/{questions?.length}
//               </span>
//             </div>
//             <Progress value={progress} className="h-2" />
//           </div>
//         </div>

//         <Carousel setApi={setCarouselApi} opts={{ watchDrag: false }}>
//           <CarouselContent>
//             {questions.map((question, index) => (
//               <CarouselItem key={question.id}>
//                 <Card className="shadow-lg">
//                   <CardHeader>
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1">
//                         <CardTitle className="text-2xl">
//                           {question.question_text}
//                         </CardTitle>

//                         {question.translation_hint && (
//                           <CardDescription className="text-base">
//                             Hint: {question.translation_hint}
//                           </CardDescription>
//                         )}
//                       </div>

//                       <Button
//                         variant="outline"
//                         size="icon"
//                         onClick={() => speak(question.question_text)}
//                         className="shrink-0"
//                         title="Pronounce"
//                       >
//                         <Volume2 className="w-5 h-5" />
//                       </Button>
//                     </div>
//                   </CardHeader>

//                   <CardContent className="space-y-6">
//                     {question.question_type === "multiple_choice" &&
//                       question.options &&
//                       index === currentQuestionIndex && (
//                         <RadioGroup
//                           value={selectedAnswer}
//                           onValueChange={setSelectedAnswer}
//                           disabled={showResult}
//                         >
//                           {question.options.map((option, i) => (
//                             <div
//                               key={i}
//                               className={`flex items-center space-x-2 p-4 rounded-lg border transition-all duration-200 hover:bg-muted hover:scale-105 ${
//                                 showResult &&
//                                 option === question.correct_answer
//                                   ? "bg-success/10 border-success animate-bounce-in"
//                                   : showResult &&
//                                     option === selectedAnswer &&
//                                     !isCorrect
//                                   ? "bg-destructive/10 border-destructive animate-shake"
//                                   : ""
//                               }`}
//                             >
//                               <RadioGroupItem value={option} id={`option-${i}`} />

//                               <Label
//                                 htmlFor={`option-${i}`}
//                                 className="flex-1 cursor-pointer"
//                               >
//                                 {option}
//                               </Label>
//                             </div>
//                           ))}
//                         </RadioGroup>
//                       )}

//                     {question.question_type === "translation" &&
//                       index === currentQuestionIndex && (
//                         <div className="space-y-2">
//                           <Label htmlFor="answer">Your answer</Label>
//                           <Input
//                             id="answer"
//                             value={selectedAnswer}
//                             onChange={(e) => setSelectedAnswer(e.target.value)}
//                             placeholder="Type your answer..."
//                             disabled={showResult}
//                             className="text-lg p-6"
//                           />
//                         </div>
//                       )}

//                     {showResult && index === currentQuestionIndex && (
//                       <div
//                         className={`p-6 rounded-lg flex items-center gap-3 ${
//                           isCorrect
//                             ? "bg-success/10 border-2 border-success animate-bounce-in"
//                             : "bg-destructive/10 border-2 border-destructive animate-shake"
//                         }`}
//                       >
//                         {isCorrect ? (
//                           <>
//                             <CheckCircle2 className="w-8 h-8 text-success animate-scale-in" />
//                             <div>
//                               <div className="font-bold text-lg text-success">
//                                 Correct!
//                               </div>
//                               <div className="text-sm">Great job!</div>
//                             </div>
//                           </>
//                         ) : (
//                           <>
//                             <XCircle className="w-8 h-8 text-destructive animate-scale-in" />
//                             <div>
//                               <div className="font-bold text-lg text-destructive">
//                                 Not quite
//                               </div>
//                               <div className="text-sm">
//                                 The correct answer is:{" "}
//                                 <span className="font-semibold">
//                                   {question.correct_answer}
//                                 </span>
//                               </div>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     )}

//                     {index === currentQuestionIndex && (
//                       <div className="flex gap-4">
//                         {!showResult ? (
//                           <Button
//                             onClick={handleSubmitAnswer}
//                             disabled={!selectedAnswer}
//                             className="w-full transition-all hover:scale-105"
//                             size="lg"
//                           >
//                             Check Answer
//                           </Button>
//                         ) : (
//                           <Button
//                             onClick={handleNextQuestion}
//                             className="w-full transition-all hover:scale-105 animate-pulse-glow"
//                             size="lg"
//                           >
//                             {currentQuestionIndex < questions.length - 1
//                               ? "Next Question"
//                               : "Complete Lesson"}
//                           </Button>
//                         )}
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               </CarouselItem>
//             ))}
//           </CarouselContent>
//         </Carousel>
//       </div>
//     </div>
//   );
// };

// export default Lesson;
