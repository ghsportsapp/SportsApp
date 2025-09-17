import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ValidationState {
  available?: boolean;
  error?: string;
  suggestions?: string[];
}

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  register: any;
  error?: string;
  validation?: ValidationState;
  isChecking?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  helpText?: string;
  className?: string;
}

export function FormField({ 
  id, 
  label, 
  type = "text", 
  placeholder, 
  register, 
  error, 
  validation, 
  isChecking, 
  onSuggestionClick,
  helpText,
  className = "mt-2"
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register}
        className={className}
      />
      
      {helpText && (
        <div className="text-xs text-gray-500 mt-1">{helpText}</div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {isChecking && (
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          Checking availability...
        </div>
      )}
      
      {validation && !validation.available && (
        <div className="mt-2">
          <div className="text-sm text-red-600 flex items-center">
            <AlertCircle className="mr-1 h-4 w-4" />
            {validation.error || "Already taken"}
          </div>
          {!validation.error && validation.suggestions && validation.suggestions.length > 0 && (
            <div className="text-sm text-gray-600 mt-1">
              Suggestions:{" "}
              {validation.suggestions.map((suggestion, index) => (
                <span key={suggestion}>
                  <button
                    type="button"
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="text-green-600 font-medium cursor-pointer hover:underline"
                  >
                    {suggestion}
                  </button>
                  {index < validation.suggestions!.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {validation && validation.available && (
        <div className="mt-2 text-sm text-green-600 flex items-center">
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Available
        </div>
      )}
    </div>
  );
}