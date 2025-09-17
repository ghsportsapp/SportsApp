import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { signupSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FormField } from "./form-field";

interface ValidationState {
  available?: boolean;
  error?: string;
  suggestions?: string[];
}

interface ValidationStates {
  username?: ValidationState;
  email?: ValidationState;
  phone?: ValidationState;
}

interface CheckingStates {
  username: boolean;
  email: boolean;
  phone: boolean;
}

interface SignupFormProps {
  onSubmit: (data: InsertUser & { confirmPassword: string; rememberMe?: boolean }) => void;
  isLoading: boolean;
  validationStates: ValidationStates;
  checkingStates: CheckingStates;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  acceptTerms: boolean;
  onAcceptTermsChange: (checked: boolean) => void;
  isMobile?: boolean;
}

export function SignupForm({
  onSubmit,
  isLoading,
  validationStates,
  checkingStates,
  onUsernameChange,
  onEmailChange,
  onPhoneChange,
  onSuggestionClick,
  acceptTerms,
  onAcceptTermsChange,
  isMobile = false
}: SignupFormProps) {
  const [, setLocation] = useLocation();

  const form = useForm<InsertUser & { confirmPassword: string; rememberMe?: boolean }>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      rememberMe: true,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        id="fullName"
        label="Full Name"
        placeholder="Enter your full name"
        register={form.register("fullName")}
        error={form.formState.errors.fullName?.message}
      />

      <FormField
        id="username"
        label="Username"
        placeholder="Choose a unique username"
        register={form.register("username", {
          onChange: (e) => onUsernameChange(e.target.value)
        })}
        error={form.formState.errors.username?.message}
        validation={validationStates.username}
        isChecking={checkingStates.username}
        onSuggestionClick={onSuggestionClick}
      />

      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="Enter your email address"
        register={form.register("email", {
          onChange: (e) => onEmailChange(e.target.value)
        })}
        error={form.formState.errors.email?.message}
        validation={validationStates.email}
        isChecking={checkingStates.email}
      />

      <FormField
        id="phone"
        label="Phone Number"
        type="tel"
        placeholder="10-digit phone number"
        register={form.register("phone", {
          onChange: (e) => {
            const value = e.target.value.replace(/\D/g, "");
            form.setValue("phone", value);
            onPhoneChange(value);
          }
        })}
        error={form.formState.errors.phone?.message}
        validation={validationStates.phone}
        isChecking={checkingStates.phone}
        helpText="Must be exactly 10 digits"
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        placeholder="Create a strong password"
        register={form.register("password")}
        error={form.formState.errors.password?.message}
      />

      <FormField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        register={form.register("confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
      />

      {/* Remember Me */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`rememberMe${isMobile ? 'Mobile' : 'Desktop'}Signup`}
          checked={form.watch("rememberMe")}
          onCheckedChange={(checked) => form.setValue("rememberMe", checked === true)}
        />
        <Label htmlFor={`rememberMe${isMobile ? 'Mobile' : 'Desktop'}Signup`} className="text-sm text-gray-600">
          Remember me for quick login
        </Label>
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="acceptTermsSignup"
          checked={acceptTerms}
          onCheckedChange={onAcceptTermsChange}
        />
        <Label htmlFor="acceptTermsSignup" className="text-sm leading-relaxed">
          I accept the{" "}
          <Button
            variant="link"
            type="button"
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium underline"
            onClick={() => setLocation("/terms")}
          >
            Terms and Conditions
          </Button>
          {" "}and{" "}
          <Button
            variant="link"
            type="button"
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium underline"
            onClick={() => setLocation("/privacy")}
          >
            Privacy Policy
          </Button>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 hover:from-slate-800 hover:via-blue-800 hover:to-green-700 text-white font-semibold py-3"
        disabled={isLoading || !acceptTerms}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Button
            variant="ghost"
            type="button"
            onClick={() => setLocation('/login')}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
          >
            Sign in here
          </Button>
        </p>
      </div>
    </form>
  );
}