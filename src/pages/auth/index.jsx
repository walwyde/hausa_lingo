// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/integrations/supabase/client";

// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import { toast } from "sonner";
// import { BookOpen } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// import {
//   Tabs,
//   TabsList,
//   TabsTrigger,
//   TabsContent,
// } from "@/components/ui/tabs";

// import {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   FormControl,
// } from "@/components/ui/form";

// // ------------------------------------------
// // VALIDATION SCHEMAS
// // ------------------------------------------

// const signInSchema = z.object({
//   email: z.string().email("Invalid email"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// const signUpSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   email: z.string().email("Invalid email"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// // ------------------------------------------

// const Auth = () => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const signInForm = useForm({
//     resolver: zodResolver(signInSchema),
//     defaultValues: { email: "", password: "" },
//   });

//   const signUpForm = useForm({
//     resolver: zodResolver(signUpSchema),
//     defaultValues: { username: "", email: "", password: "" },
//   });

//   // ------------------------------------------
//   // SIGN IN HANDLER
//   // ------------------------------------------

//   const handleSignIn = async (values) => {
//     setLoading(true);

//     try {
//       const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(values),
//       });
//       const data = await response.json();
//       const { error } = data;
//       console.log(data);
//       if (error) {
//          if (error.code === "email_not_confirmed") {
//     toast.error("Please confirm your email before signing in.");
//     signInForm.setError("email", { message: "Email not verified" });
//     setLoading(false);
//     return;
//   }
//         toast.error(error.message);
//         signInForm.setError("password", { message: "Invalid email or password" });
//         setLoading(false);
//         return;
//       }

//       // Store token in local storage
//       localStorage.setItem("token", data.token);

//       // Load user info after successful login
//       await loadUser();

//       toast.success("Welcome back!");
//       router.replace("/dashboard");
//     } catch (err) {
//       toast.error("Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ------------------------------------------
//   // SIGN UP HANDLER
//   // ------------------------------------------

//   const handleSignUp = async (e, values) => {
//   e.preventDefault();
//   setLoading(true);

//   try {
//     const response = await supabase.auth.signUp({
//       email: values.email,
//       password: values.password,
//       options: {
//         emailRedirectTo: `${window.location.origin}/`,
//         data: {
//           username: values.username,
//           display_name: values.username,
//         },
//       },
//     });

//     const { data, error } = response;
//     console.log(response);

//     if (error || !data?.user) {
//       const message = error?.message || "Sign up failed. Try another email.";
//       toast.error(message);
//       signUpForm.setError("email", { message });
//       return;
//     }

//     const user = data.user;

//     // ------------------------------------------
//     // CREATE PROFILE RECORD
//     // ------------------------------------------
//     const { error: profileError } = await supabase
//       .from("profiles")
//       .insert({
//         id: user.id,             // always use auth user ID
//         email: values.email,
//         username: values.username,
//         created_at: new Date().toISOString(),
//       });

//     if (profileError) {
//       console.error(profileError);
//       toast.error("User created but failed to save profile.");
//       return;
//     }

//     // SUCCESS
//     toast.success("Account created!");
//     router.replace("/dashboard");

//   } catch (err) {
//     toast.error("Something went wrong. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// };



//   // ------------------------------------------

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
//       <Card className="w-full max-w-md shadow-glow">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="bg-primary rounded-full p-3">
//               <BookOpen className="w-8 h-8 text-primary-foreground" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl font-bold">Hausa Learning</CardTitle>
//           <CardDescription>
//             Learn Hausa through interactive lessons
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <Tabs defaultValue="signin" className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="signin">Sign In</TabsTrigger>
//               <TabsTrigger value="signup">Sign Up</TabsTrigger>
//             </TabsList>

//             {/* SIGN IN */}
//             <TabsContent value="signin">
//               <Form {...signInForm}>
//                 <form
//                   onSubmit={signInForm.handleSubmit( handleSignIn)}
//                   className="space-y-4"
//                 >
//                   <FormField
//                     control={signInForm.control}
//                     name="email"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Email</FormLabel>
//                         <FormControl>
//                           <Input type="email" placeholder="your@email.com" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={signInForm.control}
//                     name="password"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Password</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="password"
//                             placeholder="••••••••"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <Button type="submit" className="w-full" disabled={loading}>
//                     {loading ? "Signing in..." : "Sign In"}
//                   </Button>
//                 </form>
//               </Form>
//             </TabsContent>

//             {/* SIGN UP */}
//             <TabsContent value="signup">
//               <Form {...signUpForm}>
//                 <form
//                   onSubmit={(e) => signUpForm.handleSubmit(handleSignUp(e, signUpForm.getValues()))}
//                   className="space-y-4"
//                 >
//                   <FormField
//                     control={signUpForm.control}
//                     name="username"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Username</FormLabel>
//                         <FormControl>
//                           <Input type="text" placeholder="Choose a username" {...field} />
                          
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={signUpForm.control}
//                     name="email"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Email</FormLabel>
//                         <FormControl>
//                           <Input type="email" placeholder="your@email.com" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={signUpForm.control}
//                     name="password"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Password</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="password"
//                             placeholder="••••••••"
//                             minLength={6}
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <Button type="submit" className="w-full" disabled={loading}>
//                     {loading ? "Creating account..." : "Sign Up"}
//                   </Button>
//                 </form>
//               </Form>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Auth;


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

import { useAuth } from "@/contexts/AuthContext";

// ------------------------------------------
// VALIDATION SCHEMAS
// ------------------------------------------

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ------------------------------------------

const AuthPage = () => {
  const router = useRouter();
  const { login, register, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("signin");

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  // ------------------------------------------
  // SIGN IN HANDLER
  // ------------------------------------------

  const handleSignIn = async (values) => {
    const result = await login(values.email, values.password);
    
    if (result.success) {
      toast.success("Welcome back!");
      router.replace("/dashboard");
    } else {
      toast.error(result.error);
      signInForm.setError("password", { message: result.error });
    }
  };

  // ------------------------------------------
  // SIGN UP HANDLER
  // ------------------------------------------

  const handleSignUp = async (values) => {
    const result = await register({
      username: values.username,
      email: values.email,
      password: values.password,
      display_name: values.username,
    });

    if (result.success) {
      toast.success("Account created successfully!");
      router.replace("/dashboard");
    } else {
      toast.error(result.error);
      signUpForm.setError("email", { message: result.error });
    }
  };

  // ------------------------------------------
  // FORM SUBMISSION HANDLERS
  // ------------------------------------------

  const onSignInSubmit = (e) => {
    e.preventDefault();
    signInForm.handleSubmit(handleSignIn)(e);
  };

  const onSignUpSubmit = (e) => {
    e.preventDefault();
    signUpForm.handleSubmit(handleSignUp)(e);
  };

  // ------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Hausa Learning</CardTitle>
          <CardDescription>
            Learn Hausa through interactive lessons
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* SIGN IN */}
            <TabsContent value="signin">
              <Form {...signInForm}>
                <form onSubmit={onSignInSubmit} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field} 
                            disabled={authLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={authLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={authLoading}
                  >
                    {authLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={onSignUpSubmit} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="Choose a username" 
                            {...field} 
                            disabled={authLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field} 
                            disabled={authLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={authLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={authLoading}
                  >
                    {authLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;