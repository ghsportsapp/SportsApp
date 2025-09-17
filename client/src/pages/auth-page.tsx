import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { SportsFeatures } from "@/components/auth/sports-features";
import type { InsertUser, LoginData } from "@shared/schema";

interface ValidationState {
  available?: boolean;
  error?: string;
  suggestions?: string[];
}

const STORAGE_KEY = 'sportsapp_saved_logins';

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Determine mode based on current route
  const isLogin = useMemo(() => location === '/login', [location]);
  
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [validationStates, setValidationStates] = useState<{
    username?: ValidationState;
    email?: ValidationState;
    phone?: ValidationState;
  }>({});
  
  const [checkingStates, setCheckingStates] = useState({
    username: false,
    email: false,
    phone: false
  });
  
  const [savedLogins, setSavedLogins] = useState<Array<{ username: string; token: string }>>([]);

  // Load saved logins
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedLogins(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved logins:', error);
      }
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) setLocation("/home");
  }, [user, setLocation]);

  // Save login to localStorage
  const saveLogin = useCallback((username: string, token: string) => {
    const updated = [
      { username, token }, 
      ...savedLogins.filter(login => login.username !== username)
    ].slice(0, 5);
    setSavedLogins(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedLogins]);

  // Remove login from localStorage
  const removeLogin = useCallback((username: string) => {
    const updated = savedLogins.filter(login => login.username !== username);
    setSavedLogins(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedLogins]);

  // Quick login with token
  const quickLogin = useCallback(async (username: string) => {
    const loginData = savedLogins.find(login => login.username === username);
    if (!loginData) return;

    try {
      const response = await fetch('/api/quick-login', {
        method: 'POST',
        body: JSON.stringify({ rememberToken: loginData.token }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        setTimeout(() => {
          toast({ title: "Welcome back!", description: "Quick login successful!" });
          setLocation("/home");
        }, 100);
      } else {
        removeLogin(username);
        toast({
          title: "Login expired",
          description: "Please login again with your password"
        });
      }
    } catch (error) {
      console.error('Quick login failed:', error);
      toast({
        title: "Quick login failed",
        description: "Please try logging in with your password",
        variant: "destructive"
      });
    }
  }, [savedLogins, toast, setLocation, removeLogin]);

  // Username validation
  const validateUsernameFormat = useCallback((username: string) => {
    if (username.length === 0) return null;
    if (!/^[a-zA-Z]/.test(username)) return "Username must start with a letter";
    if (/\.\./.test(username)) return "Username cannot have consecutive dots";
    if (/\.$/.test(username)) return "Username cannot end with a dot";
    if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(username)) return "Username can only contain letters, numbers, underscores, and dots";
    if (username.length < 3) return "Username must be at least 3 characters long";
    if (username.length > 20) return "Username cannot exceed 20 characters";
    return null;
  }, []);

  // Check username availability
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) return;
    
    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setValidationStates(prev => ({ ...prev, username: { available: false, error: formatError } }));
      return;
    }
    
    setCheckingStates(prev => ({ ...prev, username: true }));
    try {
      const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
      const result = await response.json();
      setValidationStates(prev => ({ ...prev, username: result }));
    } catch (error) {
      console.error("Failed to check username:", error);
    } finally {
      setCheckingStates(prev => ({ ...prev, username: false }));
    }
  }, [validateUsernameFormat]);

  // Check email availability
  const checkEmail = useCallback(async (email: string) => {
    if (!email.includes("@")) return;
    
    setCheckingStates(prev => ({ ...prev, email: true }));
    try {
      const response = await fetch(`/api/check-email/${encodeURIComponent(email)}`);
      const result = await response.json();
      setValidationStates(prev => ({ ...prev, email: result }));
    } catch (error) {
      console.error("Failed to check email:", error);
    } finally {
      setCheckingStates(prev => ({ ...prev, email: false }));
    }
  }, []);

  // Check phone availability
  const checkPhone = useCallback(async (phone: string) => {
    if (phone.length !== 10) return;
    
    setCheckingStates(prev => ({ ...prev, phone: true }));
    try {
      const response = await fetch(`/api/check-phone/${encodeURIComponent(phone)}`);
      const result = await response.json();
      setValidationStates(prev => ({ ...prev, phone: result }));
    } catch (error) {
      console.error("Failed to check phone:", error);
    } finally {
      setCheckingStates(prev => ({ ...prev, phone: false }));
    }
  }, []);

  // Handle username change
  const handleUsernameChange = useCallback((value: string) => {
    if (value.length > 0) {
      const formatError = validateUsernameFormat(value);
      if (formatError) {
        setValidationStates(prev => ({ ...prev, username: { available: false, error: formatError } }));
      } else if (value.length >= 3) {
        checkUsername(value);
      } else {
        setValidationStates(prev => ({ ...prev, username: undefined }));
      }
    } else {
      setValidationStates(prev => ({ ...prev, username: undefined }));
    }
  }, [validateUsernameFormat, checkUsername]);

  // Handle email change
  const handleEmailChange = useCallback((value: string) => {
    if (value.includes("@")) {
      checkEmail(value);
    } else {
      setValidationStates(prev => ({ ...prev, email: undefined }));
    }
  }, [checkEmail]);

  // Handle phone change
  const handlePhoneChange = useCallback((value: string) => {
    if (value.length === 10 && /^\d{10}$/.test(value)) {
      checkPhone(value);
    } else {
      setValidationStates(prev => ({ ...prev, phone: undefined }));
    }
  }, [checkPhone]);

  // Apply username suggestion
  const applySuggestion = useCallback((suggestion: string) => {
    toast({
      title: "Suggestion applied",
      description: `Username changed to ${suggestion}`,
    });
  }, [toast]);

  // Handle login
  const handleLogin = useCallback(async (data: LoginData) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      if (data.rememberMe && result?.rememberToken) {
        saveLogin(data.username, result.rememberToken);
      }
      setLocation("/home");
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [loginMutation, saveLogin, setLocation]);

  // Handle signup
  const handleSignup = useCallback(async (data: InsertUser & { confirmPassword: string; rememberMe?: boolean }) => {
    try {
      const result = await registerMutation.mutateAsync(data);
      if (data.rememberMe && result?.rememberToken) {
        saveLogin(data.username, result.rememberToken);
      }
      setLocation("/home");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  }, [registerMutation, saveLogin, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      {isMobile ? (
        /* Mobile Layout */
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-sm border-0">
              <CardContent className="p-8">
                {/* Logo */}
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold font-inter">
                    <span className="text-blue-600">SPORTS</span>
                    <span className="text-red-500">APP</span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {isLogin ? "Sign in to continue" : "Create your account"}
                  </p>
                </div>

                {/* Form */}
                {isLogin ? (
                  <LoginForm
                    onSubmit={handleLogin}
                    isLoading={loginMutation.isPending}
                    savedLogins={savedLogins}
                    onQuickLogin={quickLogin}
                    onRemoveLogin={removeLogin}
                    isMobile
                  />
                ) : (
                  <SignupForm
                    onSubmit={handleSignup}
                    isLoading={registerMutation.isPending}
                    validationStates={validationStates}
                    checkingStates={checkingStates}
                    onUsernameChange={handleUsernameChange}
                    onEmailChange={handleEmailChange}
                    onPhoneChange={handlePhoneChange}
                    onSuggestionClick={applySuggestion}
                    acceptTerms={acceptTerms}
                    onAcceptTermsChange={(checked) => setAcceptTerms(checked)}
                    isMobile
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile Sports Visual */}
          <div className="px-6 pb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <SportsFeatures isMobile showForLogin={isLogin} />
              <p className="text-white/80 text-sm">
                Join the ultimate sports community
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="relative z-10 min-h-screen flex">
          {/* Left Side */}
          <div className="flex-1 flex flex-col justify-center items-center px-12 py-8">
            <div className="max-w-lg text-center">
              {!isLogin && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-8 font-inter">
                    What's Inside SportsApp
                  </h1>
                  <div className="mb-6">
                    <ScreenshotCarousel />
                  </div>
                </div>
              )}

              {isLogin && (
                <div>
                  <h1 className="text-5xl font-bold text-white mb-4 font-inter">
                    Welcome Back
                  </h1>
                  <h2 className="text-6xl font-bold mb-8 font-inter">
                    <span className="text-white">SPORTS</span>
                    <span className="text-yellow-300">APP</span>
                  </h2>
                </div>
              )}

              <SportsFeatures showForLogin={isLogin} />
              
              {isLogin && (
                <p className="text-lg text-blue-100 font-medium">
                  Ready to dive back into the action?
                </p>
              )}
            </div>
          </div>

          {/* Right Side - Forms */}
          <div className="w-1/2 max-w-lg flex items-center justify-center px-8 pr-12">
            <Card className="w-full shadow-2xl bg-white/95 backdrop-blur-sm border-0">
              <CardContent className="p-10">
                {/* Logo */}
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold font-inter">
                    <span className="text-blue-600">SPORTS</span>
                    <span className="text-red-500">APP</span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {isLogin ? "Sign in to continue" : "Create your account"}
                  </p>
                </div>

                {!isLogin && (
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Signup to SportsApp</h2>
                    <p className="text-gray-600 leading-relaxed">
                      Join the ultimate sports community where athletes and fans connect, share, and grow together
                    </p>
                  </div>
                )}

                {/* Form */}
                {isLogin ? (
                  <LoginForm
                    onSubmit={handleLogin}
                    isLoading={loginMutation.isPending}
                    savedLogins={savedLogins}
                    onQuickLogin={quickLogin}
                    onRemoveLogin={removeLogin}
                  />
                ) : (
                  <SignupForm
                    onSubmit={handleSignup}
                    isLoading={registerMutation.isPending}
                    validationStates={validationStates}
                    checkingStates={checkingStates}
                    onUsernameChange={handleUsernameChange}
                    onEmailChange={handleEmailChange}
                    onPhoneChange={handlePhoneChange}
                    onSuggestionClick={applySuggestion}
                    acceptTerms={acceptTerms}
                    onAcceptTermsChange={(checked) => setAcceptTerms(checked)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}