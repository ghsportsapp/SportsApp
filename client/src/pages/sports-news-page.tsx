import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Globe, Calendar, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { QUERY_CONFIGS } from "@/utils/performance";
import { LazyImage } from "@/components/lazy-image";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  titleHi?: string;
  descriptionHi?: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

// Fallback content for offline mode with Hindi translations
const fallbackArticles: NewsArticle[] = [
  {
    title: "Indian Cricket Team Prepares for Upcoming Series",
    titleHi: "भारतीय क्रिकेट टीम आगामी श्रृंखला की तैयारी कर रही है",
    description: "The Indian national cricket team is gearing up for the upcoming international series with intensive training sessions and strategic planning.",
    descriptionHi: "भारतीय राष्ट्रीय क्रिकेट टीम गहन प्रशिक्षण सत्रों और रणनीतिक योजना के साथ आगामी अंतर्राष्ट्रीय श्रृंखला की तैयारी कर रही है।",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop",
    publishedAt: new Date().toISOString(),
    source: { name: "Sports India" }
  },
  {
    title: "ISL Season Shows Promising Growth in Indian Football",
    titleHi: "ISL सीज़न भारतीय फुटबॉल में आशाजनक वृद्धि दिखाता है",
    description: "The Indian Super League continues to attract talent and viewership, marking significant progress in the development of football in India.",
    descriptionHi: "भारतीय सुपर लीग प्रतिभा और दर्शकों को आकर्षित करना जारी रखती है, जो भारत में फुटबॉल के विकास में महत्वपूर्ण प्रगति का प्रतीक है।",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Football India" }
  },
  {
    title: "Badminton Championship Sees Record Participation",
    titleHi: "बैडमिंटन चैंपियनशिप में रिकॉर्ड भागीदारी",
    description: "Local badminton tournaments across India are witnessing unprecedented participation from young athletes, signaling a bright future for the sport.",
    descriptionHi: "भारत भर में स्थानीय बैडमिंटन टूर्नामेंट युवा एथलीटों की अभूतपूर्व भागीदारी देख रहे हैं, जो खेल के लिए एक उज्ज्वल भविष्य का संकेत देते हैं।",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1594736797933-d0801ba2fe65?w=800&h=400&fit=crop",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Badminton Today" }
  }
];

// Simple translation function for common sports terms
const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (targetLang === 'en' || !text) return text;
  
  // Basic word-by-word translation for common sports terms
  const translations: Record<string, string> = {
    'cricket': 'क्रिकेट',
    'football': 'फुटबॉल',
    'soccer': 'फुटबॉल',
    'basketball': 'बास्केटबॉल',
    'tennis': 'टेनिस',
    'badminton': 'बैडमिंटन',
    'hockey': 'हॉकी',
    'kabaddi': 'कबड्डी',
    'athletics': 'एथलेटिक्स',
    'wrestling': 'कुश्ती',
    'boxing': 'बॉक्सिंग',
    'chess': 'शतरंज',
    'team': 'टीम',
    'player': 'खिलाड़ी',
    'match': 'मैच',
    'game': 'खेल',
    'tournament': 'टूर्नामेंट',
    'championship': 'चैंपियनशिप',
    'series': 'श्रृंखला',
    'season': 'सीज़न',
    'league': 'लीग',
    'indian': 'भारतीय',
    'india': 'भारत',
    'world': 'विश्व',
    'international': 'अंतर्राष्ट्रीय',
    'national': 'राष्ट्रीय',
    'victory': 'जीत',
    'win': 'जीत',
    'defeat': 'हार',
    'final': 'फाइनल',
    'semi-final': 'सेमी-फाइनल',
    'training': 'प्रशिक्षण',
    'coach': 'कोच'
  };

  let translatedText = text.toLowerCase();
  
  // Replace common sports terms
  Object.entries(translations).forEach(([en, hi]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translatedText = translatedText.replace(regex, hi);
  });
  
  return translatedText;
};

export default function SportsNewsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading, error, refetch, isError } = useQuery<NewsResponse>({
    queryKey: ['/api/sports-news', { page: currentPage }],
    queryFn: async () => {
      const response = await fetch(`/api/sports-news?page=${currentPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sports news');
      }
      return response.json();
    },
    ...QUERY_CONFIGS.frequent, // Use optimized configuration
    retry: 3
  });

  // Handle success/error state changes
  useEffect(() => {
    if (data && !isError) {
      setIsOffline(false);
      if (currentPage === 1) {
        setAllArticles(data.articles);
      } else {
        setAllArticles(prev => [...prev, ...data.articles]);
      }
      setIsLoadingMore(false);
    } else if (isError) {
      setIsOffline(true);
      setIsLoadingMore(false);
    }
  }, [data, isError, currentPage]);

  // Auto-refresh functionality for real-time updates (only for first page)
  useEffect(() => {
    if (currentPage === 1) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
        refetch();
      }, 60 * 60 * 1000); // Refresh every hour for real-time updates

      return () => clearInterval(interval);
    }
  }, [refetch, currentPage]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  };

  const articles = isError || isOffline ? fallbackArticles : allArticles;
  const showFallback = isError || isOffline || (articles.length === 0 && !isLoading);
  const hasMore = data?.hasMore && !isError && !isOffline;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="main-content flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0 mt-6 md:mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('news.pageTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('news.pageDescription')}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {showFallback && (
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{t('news.error')}</span>
              </div>
            )}
            
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
{t('news.loading')}: {format(lastRefresh, 'HH:mm')}
              </span>
            </Badge>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !showFallback && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('sportsNews.unableToLoad')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('sportsNews.troubleFetching')}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('sportsNews.tryAgain')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* News Grid */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card 
                key={`${article.title}-${index}`}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop";
                    }}
                  />
                  {showFallback && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.source.name}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(article.publishedAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {language === 'hi' && article.titleHi ? article.titleHi : article.title}
                  </h3>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                    {language === 'hi' && article.descriptionHi ? article.descriptionHi : article.description}
                  </p>
                  
                  <Button
                    asChild
                    size="sm"
                    className="w-full text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                    disabled={showFallback}
                    style={{
                      backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
                      backgroundSize: '200% auto',
                      transition: 'background-position 0.5s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundPosition = 'right center';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundPosition = 'left center';
                    }}
                  >
                    <a
                      href={showFallback ? "#" : article.url}
                      target={showFallback ? "_self" : "_blank"}
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2"
                    >
                      <span>{t('sportsNews.readMore')}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !showFallback && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              size="lg"
              className="px-8 py-3"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('sportsNews.loading')}
                </>
              ) : (
                t('sportsNews.seeOlderNews')
              )}
            </Button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showFallback 
              ? "Showing sample content while offline. Connect to internet for live updates."
              : `Showing ${articles.length} global sports articles • Prioritizing Indian sports • Updates every hour`
            }
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}