import { Button, type ButtonProps } from "./button";
import { forwardRef } from "react";

const GRADIENT_STYLES = {
  background: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
  size: '200%',
  transition: 'background-position 0.5s ease'
};

interface GradientButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, className = "", onMouseEnter, onMouseLeave, ...props }, ref) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundPosition = 'right center';
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundPosition = 'left center';
      onMouseLeave?.(e);
    };

    return (
      <Button
        ref={ref}
        className={`text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${className}`}
        style={{
          backgroundImage: GRADIENT_STYLES.background,
          backgroundSize: GRADIENT_STYLES.size,
          transition: GRADIENT_STYLES.transition
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

GradientButton.displayName = "GradientButton";