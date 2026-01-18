"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Users, BookOpen, HelpCircle, Award, Edit, Shield, ShieldOff, RefreshCw } from "lucide-react";

const Admin = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "multiple_choice",
    correct_answer: "",
    options: "",
    translation_hint: "",
    order_index: 1,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLessons: 0,
    totalQuestions: 0,
    totalAchievements: 0,
  });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    difficulty: "beginner",
    xp_reward: 10,
    order_index: 0,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      
      if (response.status === 401) {
        toast.error("Please login first");
        router.push("/auth");
        return;
      }
      
      if (response.status === 403) {
        toast.error("Access denied. Admin only.");
        router.push("/dashboard");
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setIsAdmin(true);
        await Promise.all([fetchStats(), fetchLessons(), fetchUsers()]);
      }
    } catch (error) {
      toast.error("Failed to verify admin status");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("Failed to load stats");
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/admin/lessons');
      const data = await response.json();
      
      if (data.success) {
        setLessons(data.lessons || []);
        setNewLesson(prev => ({ ...prev, order_index: data.lessons?.length || 0 }));
      }
    } catch (error) {
      toast.error("Failed to load lessons");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const fetchQuestionsForLesson = async (lessonId) => {
    try {
      const response = await fetch(`/api/admin/questions?lessonId=${lessonId}`);
      const data = await response.json();
      
      if (data.success) {
        setEditingQuestions(data.questions || []);
        setNewQuestion(prev => ({ 
          ...prev, 
          order_index: (data.questions?.length || 0) + 1 
        }));
      }
    } catch (error) {
      toast.error("Failed to load questions");
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLesson),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lesson');
      }

      if (data.success) {
        toast.success("Lesson created successfully! 🎉");
        setNewLesson({
          title: "",
          description: "",
          difficulty: "beginner",
          xp_reward: 10,
          order_index: lessons.length,
        });
        fetchLessons();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!editingLesson) return;
    
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLesson),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lesson');
      }

      if (data.success) {
        toast.success("Lesson updated successfully! ✅");
        setEditingLesson(null);
        setEditingQuestions([]);
        fetchLessons();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm("Are you sure you want to delete this lesson? This will also delete all questions in this lesson.")) return;
    
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lesson');
      }

      if (data.success) {
        toast.success("Lesson deleted successfully!");
        fetchLessons();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!editingLesson) return;
    
    try {
      const questionData = {
        ...newQuestion,
        lesson_id: editingLesson.id,
      };

      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create question');
      }

      if (data.success) {
        toast.success("Question created successfully! ✅");
        setNewQuestion({
          question_text: "",
          question_type: "multiple_choice",
          correct_answer: "",
          options: "",
          translation_hint: "",
          order_index: editingQuestions.length + 1,
        });
        fetchQuestionsForLesson(editingLesson.id);
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: questionId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete question');
      }

      if (data.success) {
        toast.success("Question deleted successfully!");
        fetchQuestionsForLesson(editingLesson.id);
        fetchStats();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    try {
      const action = currentRole === "admin" ? "revoke" : "grant";
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin role');
      }

      if (data.success) {
        toast.success(
          action === "grant" 
            ? "Admin role granted! 🛡️" 
            : "Admin role removed! 🔓"
        );
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    fetchQuestionsForLesson(lesson.id);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchLessons(), fetchUsers()]);
      toast.success("Data refreshed successfully! 🔄");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            Loading admin dashboard... ⚙️
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/5">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mb-4 group hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage your learning platform</p>
            </div>
            <Button 
              variant="outline" 
              onClick={refreshAll}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:scale-[1.02] transition-transform">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-10 h-10 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Lessons</p>
                    <p className="text-3xl font-bold">{stats.totalLessons}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                    <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                  </div>
                  <HelpCircle className="w-10 h-10 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-[1.02] transition-transform">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                    <p className="text-3xl font-bold">{stats.totalAchievements}</p>
                  </div>
                  <Award className="w-10 h-10 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="lessons" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Lessons
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Users
              </TabsTrigger>
            </TabsList>

            {/* Lessons Tab */}
            <TabsContent value="lessons" className="space-y-6">
              {/* Create Lesson Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Lesson
                  </CardTitle>
                  <CardDescription>
                    Add a new Hausa language lesson to the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateLesson} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          placeholder="Introduction to Hausa Greetings"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="xp_reward">XP Reward *</Label>
                        <Input
                          id="xp_reward"
                          type="number"
                          value={newLesson.xp_reward}
                          onChange={(e) => setNewLesson({ ...newLesson, xp_reward: parseInt(e.target.value) || 10 })}
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        placeholder="Brief description of the lesson..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select
                          value={newLesson.difficulty}
                          onValueChange={(value) =>
                            setNewLesson({ ...newLesson, difficulty: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order_index">Order Index</Label>
                        <Input
                          id="order_index"
                          type="number"
                          value={newLesson.order_index}
                          onChange={(e) => setNewLesson({ ...newLesson, order_index: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Lesson
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Lessons Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Manage Lessons ({lessons.length})
                  </CardTitle>
                  <CardDescription>
                    View, edit and manage existing lessons
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                              #{lesson.order_index}
                            </div>
                            <h3 className="font-bold text-lg">{lesson.title}</h3>
                          </div>
                          {lesson.description && (
                            <p className="text-muted-foreground mt-2">{lesson.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Difficulty: <span className="font-medium">{lesson.difficulty}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              XP: <span className="font-medium">{lesson.xp_reward}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              Created: {new Date(lesson.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => handleEditLesson(lesson)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Lesson: {lesson.title}</DialogTitle>
                                <DialogDescription>
                                  Update lesson details and manage questions
                                </DialogDescription>
                              </DialogHeader>
                              
                              {editingLesson && (
                                <div className="space-y-6">
                                  <form onSubmit={handleUpdateLesson} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Title *</Label>
                                        <Input
                                          value={editingLesson.title}
                                          onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>XP Reward *</Label>
                                        <Input
                                          type="number"
                                          value={editingLesson.xp_reward}
                                          onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: parseInt(e.target.value) || 10 })}
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingLesson.description || ""}
                                        onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                        rows={3}
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label>Difficulty</Label>
                                        <Select
                                          value={editingLesson.difficulty}
                                          onValueChange={(value) => setEditingLesson({ ...editingLesson, difficulty: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Order Index</Label>
                                        <Input
                                          type="number"
                                          value={editingLesson.order_index}
                                          onChange={(e) => setEditingLesson({ ...editingLesson, order_index: parseInt(e.target.value) || 0 })}
                                        />
                                      </div>
                                      <div className="flex items-end">
                                        <Button type="submit" className="w-full">
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  </form>

                                  {/* Questions Management */}
                                  <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Manage Questions</h3>
                                    
                                    {/* Add Question Form */}
                                    <Card className="mb-6">
                                      <CardHeader>
                                        <CardTitle className="text-sm">Add New Question</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <form onSubmit={handleCreateQuestion} className="space-y-4">
                                          <div className="space-y-2">
                                            <Label>Question Text *</Label>
                                            <Textarea
                                              value={newQuestion.question_text}
                                              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                              placeholder="Enter the question..."
                                              rows={2}
                                              required
                                            />
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                              <Label>Question Type</Label>
                                              <Select
                                                value={newQuestion.question_type}
                                                onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                  <SelectItem value="translation">Translation</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Order Index</Label>
                                              <Input
                                                type="number"
                                                value={newQuestion.order_index}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, order_index: parseInt(e.target.value) || 1 })}
                                                min="1"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Correct Answer *</Label>
                                              <Input
                                                value={newQuestion.correct_answer}
                                                onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                                                required
                                              />
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label>Options (JSON array - for multiple choice)</Label>
                                            <Textarea
                                              value={newQuestion.options}
                                              onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                                              placeholder='["Option A", "Option B", "Option C", "Option D"]'
                                              rows={2}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              Enter as JSON array. Leave empty for translation questions.
                                            </p>
                                          </div>

                                          <div className="space-y-2">
                                            <Label>Translation Hint (optional)</Label>
                                            <Input
                                              value={newQuestion.translation_hint}
                                              onChange={(e) => setNewQuestion({ ...newQuestion, translation_hint: e.target.value })}
                                            />
                                          </div>

                                          <Button type="submit" className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Question
                                          </Button>
                                        </form>
                                      </CardContent>
                                    </Card>

                                    {/* Existing Questions */}
                                    {editingQuestions.length > 0 ? (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle>Questions ({editingQuestions.length})</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                          <div className="overflow-x-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>#</TableHead>
                                                  <TableHead>Question</TableHead>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead>Correct Answer</TableHead>
                                                  <TableHead>Actions</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {editingQuestions.map((question, idx) => (
                                                  <TableRow key={question.id}>
                                                    <TableCell className="font-medium">{question.order_index}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                      {question.question_text}
                                                    </TableCell>
                                                    <TableCell>
                                                      <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
                                                        {question.question_type}
                                                      </span>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                      {question.correct_answer}
                                                    </TableCell>
                                                    <TableCell>
                                                      <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </Button>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ) : (
                                      <div className="text-center py-8 text-muted-foreground">
                                        No questions yet. Add your first question above.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}

                    {lessons.length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">No lessons yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Create your first lesson to get started!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Manage Users ({users.length})
                  </CardTitle>
                  <CardDescription>
                    View users and manage admin roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {user.display_name || user.username}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    @{user.username} • {user.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-primary">
                                  {user.total_xp.toLocaleString()} XP
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {user.role === "admin" ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                                    <Shield className="w-3 h-3" /> Admin
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">User</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant={user.role === "admin" ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => handleToggleAdmin(user.id, user.role)}
                                  className="flex items-center gap-2"
                                >
                                  {user.role === "admin" ? (
                                    <>
                                      <ShieldOff className="w-4 h-4" /> Remove Admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-4 h-4" /> Make Admin
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium mb-2">No users yet</h3>
                      <p className="text-muted-foreground">
                        Users will appear here once they register.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
