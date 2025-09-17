import { useLanguage } from '@/hooks/use-language';

interface TranslatableTextProps {
  children: string;
  className?: string;
  hindi?: string;
}

// Simple translation dictionary for key UI elements
const translations: Record<string, string> = {
  "Home": "होम",
  "Feed": "फीड",
  "Sports News": "स्पोर्ट्स न्यूज़",
  "Do Drills and Earn": "ड्रिल करें और कमाएं",
  "Tryouts": "ट्रायआउट्स",
  "Cricket Coaching": "क्रिकेट कोचिंग",
  "My Profile": "मेरी प्रोफाइल",
  "Language": "भाषा",
  "Logout": "लॉगआउट",
  "Select Language": "भाषा चुनें",
  "Choose your preferred language": "अपनी पसंदीदा भाषा चुनें",
  "English": "English",
  "हिंदी": "हिंदी"
};

export function TranslatableText({ children, className, hindi }: TranslatableTextProps) {
  const { language } = useLanguage();
  
  if (language === 'hi') {
    // Use provided Hindi translation or look in dictionary
    const translated = hindi || translations[children] || children;
    return <span className={className}>{translated}</span>;
  }

  return <span className={className}>{children}</span>;
}