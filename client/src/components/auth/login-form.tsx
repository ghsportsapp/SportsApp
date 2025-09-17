import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { QuickLoginDropdown } from "./quick-login-dropdown";

interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
  isLoading: boolean;
  savedLogins: Array<{ username: string; token: string }>;
  onQuickLogin: (username: string) => void;
  onRemoveLogin: (username: string) => void;
  isMobile?: boolean;
}

export function LoginForm({ 
  onSubmit, 
  isLoading, 
  savedLogins, 
  onQuickLogin, 
  onRemoveLogin,
  isMobile = false
}: LoginFormProps) {
  const [, setLocation] = useLocation();
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  const handleUsernameClick = useCallback(() => {
    if (savedLogins.length > 0) {
      setShowUsernameSuggestions(true);
    }
  }, [savedLogins]);

  const hideDropdown = useCallback(() => {
    setTimeout(() => setShowUsernameSuggestions(false), 300);
  }, []);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="relative">
        <Label htmlFor={`loginUsername${isMobile ? 'Mobile' : 'Desktop'}`}>Username</Label>
        <Input
          id={`loginUsername${isMobile ? 'Mobile' : 'Desktop'}`}
          type="text"
          placeholder="Enter your username"
          {...form.register("username")}
          className="mt-2"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onFocus={handleUsernameClick}
          onBlur={hideDropdown}
        />
        {form.formState.errors.username && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.username.message}</p>
        )}
        
        {showUsernameSuggestions && savedLogins.length > 0 && (
          <QuickLoginDropdown
            savedLogins={savedLogins}
            onQuickLogin={onQuickLogin}
            onRemoveLogin={onRemoveLogin}
          />
        )}
      </div>

      <div>
        <Label htmlFor="loginPassword">Password</Label>
        <Input
          id="loginPassword"
          type="password"
          placeholder="Enter your password"
          {...form.register("password")}
          className="mt-2"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}
        <div className="text-right mt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setLocation('/forgot-password')}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium text-sm"
            data-testid="link-forgot-password"
          >
            Forgot password?
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id={`rememberMe${isMobile ? 'Mobile' : 'Desktop'}`}
          checked={form.watch("rememberMe")}
          onCheckedChange={(checked) => form.setValue("rememberMe", checked === true)}
        />
        <Label htmlFor={`rememberMe${isMobile ? 'Mobile' : 'Desktop'}`} className="text-sm text-gray-600">
          Remember me
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 hover:from-slate-800 hover:via-blue-800 hover:to-green-700 text-white font-semibold py-3 mt-4"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Button
            variant="ghost"
            type="button"
            onClick={() => setLocation('/signup')}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
          >
            Create one here
          </Button>
        </p>
      </div>
    </form>
  );
}