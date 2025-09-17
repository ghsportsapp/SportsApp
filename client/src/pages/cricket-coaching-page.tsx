import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Upload, Camera, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Pose, POSE_LANDMARKS } from "@mediapipe/pose";
import { measurePerformance } from "@/utils/performance";

type CoachingType = "batting" | "bowling";
type AnalysisStage = "selection" | "instructions" | "upload" | "analyzing" | "results";

interface PoseAnalysisResult {
  isValid: boolean;
  type: CoachingType;
  score: number;
  feedback: string[];
  warnings: string[];
  errors: string[];
}

export default function CricketCoachingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedType, setSelectedType] = useState<CoachingType | null>(null);
  const [stage, setStage] = useState<AnalysisStage>("selection");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<PoseAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized handlers for better performance
  const handleTypeSelection = useCallback((type: CoachingType) => {
    setSelectedType(type);
    setStage("instructions");
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedType(null);
    setStage("selection");
    setUploadedFile(null);
    setUploadProgress(0);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError("Please upload a valid video file.");
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("Video file size must be less than 50MB.");
        return;
      }

      setUploadedFile(file);
      setStage("analyzing");
      setError(null);
      analyzeVideo(file);
    }
  };

  // Smooth progress bar animation
  useEffect(() => {
    if (isAnalyzing && uploadProgress < 100) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) return 100;
          // Increase progress by 1-3% every 150ms for smooth animation
          const increment = Math.random() * 2 + 1;
          return Math.min(prev + increment, 100);
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing, uploadProgress]);

  const analyzeVideo = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(1); // Start at 1%
    setError(null);

    try {
      // Performance-measured video analysis
      await measurePerformance('VideoAnalysis', async () => {
        // Upload video file first
        const formData = new FormData();
        formData.append('video', file);
        formData.append('type', selectedType!);

        const uploadResponse = await fetch('/api/cricket-coaching/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to upload video');
        }

      const uploadResult = await uploadResponse.json();

      // Start pose analysis
      const analysisResponse = await fetch('/api/cricket-coaching/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl: uploadResult.videoUrl,
          type: selectedType,
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to analyze video');
      }

      const analysis = await analysisResponse.json();
      
      // Ensure progress reaches 100% before showing results
      setUploadProgress(100);
      
      // Brief delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAnalysisResult(analysis);
      setStage("results");
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedType]);

  const resetAnalysis = () => {
    setSelectedType(null);
    setStage("selection");
    setUploadedFile(null);
    setUploadProgress(0);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryAnalysis = () => {
    if (uploadedFile) {
      setError(null);
      setUploadProgress(0);
      setStage("analyzing");
      analyzeVideo(uploadedFile);
    }
  };

  const goBack = () => {
    if (stage === "instructions") {
      setStage("selection");
      setSelectedType(null);
    } else if (stage === "upload" || stage === "analyzing" || stage === "results") {
      setStage("instructions");
      setUploadedFile(null);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const renderTypeSelection = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`mb-8 ${isMobile ? 'mt-6' : 'mt-4'}`}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-left">
          {t('cricketCoaching.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-left">
          {t('cricketCoaching.uploadInstructions')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={() => handleTypeSelection("batting")}
          style={{
            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
            backgroundSize: '200% auto',
            transition: 'background-position 0.5s ease',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundPosition = 'right center';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundPosition = 'left center';
          }}
        >
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏏</span>
              <CardTitle className="text-white">{t('cricketCoaching.batting')}</CardTitle>
            </div>
            <CardDescription className="text-gray-100">
              {t('cricketCoaching.analyzeBatting') || 'Analyze your batting stance, grip, footwork, and shot execution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-100">
              {t('cricketCoaching.instructions.battingDescription').split('\n').map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={() => handleTypeSelection("bowling")}
          style={{
            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
            backgroundSize: '200% auto',
            transition: 'background-position 0.5s ease',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundPosition = 'right center';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundPosition = 'left center';
          }}
        >
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏐</span>
              <CardTitle className="text-white">{t('cricketCoaching.bowling')}</CardTitle>
            </div>
            <CardDescription className="text-gray-100">
              {t('cricketCoaching.analyzeBowling') || 'Analyze your bowling action, release point, and follow-through'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-100">
              {t('cricketCoaching.instructions.bowlingDescription').split('\n').map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedType === "batting" ? t('cricketCoaching.batting') : t('cricketCoaching.bowling')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('cricketCoaching.instructions.followInstructions')}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{t('cricketCoaching.instructions.cameraSetup')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('cricketCoaching.instructions.ensureAngle')}</strong>
              <br />
              {t('cricketCoaching.instructions.faceBatsman')}
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t('cricketCoaching.instructions.cameraPosition')}</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• {t('cricketCoaching.instructions.position10to15')}</li>
                <li>• {t('cricketCoaching.instructions.keepChestHeight')}</li>
                <li>• {t('cricketCoaching.instructions.ensureFullBody')}</li>
                <li>• {t('cricketCoaching.instructions.recordLandscape')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t('cricketCoaching.instructions.videoRequirements')}</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• {t('cricketCoaching.instructions.goodLighting')}</li>
                <li>• {t('cricketCoaching.instructions.stableCamera')}</li>
                <li>• {t('cricketCoaching.instructions.clearBackground')}</li>
                <li>• {t('cricketCoaching.instructions.fiveToThirty')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('cricketCoaching.instructions.uploadYourVideo')}</CardTitle>
          <CardDescription>
            {t('cricketCoaching.instructions.selectVideoFile')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {uploadedFile ? uploadedFile.name : (t('common.save') === 'सहेजें' ? 'वीडियो अपलोड करें' : 'Upload Video')}
              </h3>
              <p className="text-gray-500 mb-4">
                MP4, MOV, AVI up to 50MB
              </p>
              <Button variant="outline">
                {t('common.save') === 'सहेजें' ? 'वीडियो चुनें' : 'Select Video'}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                }}
              >
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('cricketCoaching.analysis.analyzingVideo')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('cricketCoaching.analysis.processingTechnique', { type: selectedType })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('cricketCoaching.analysis.processingFrames')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                  }}
                ></div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {t('cricketCoaching.analysis.takeFewMoments')}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {error && (
              <div className="flex space-x-4 justify-center mt-6">
                <Button 
                  onClick={retryAnalysis}
                  className="text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
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
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('cricketCoaching.analysis.retryAnalysis')}
                </Button>
                <Button onClick={goBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('cricketCoaching.analysis.goBack')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`mb-6 ${isMobile ? 'mt-6' : 'mt-4'}`}>
        <div className={`${isMobile ? 'px-2' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-left mb-2">
            {t('cricketCoaching.results')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-left mb-4">
            {t('cricketCoaching.analysis.techniqueAnalysis', { type: selectedType === "batting" ? t('cricketCoaching.batting') : t('cricketCoaching.bowling') })}
          </p>
        </div>
        
        {/* Mobile: Buttons side by side, Desktop: New Analysis button on right */}
        <div className={`${isMobile ? 'grid grid-cols-2 gap-3 px-2' : 'flex justify-end'}`}>
          <Button 
            onClick={resetAnalysis}
            className={`text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] rounded-lg ${isMobile ? 'w-full text-sm' : ''}`}
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
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('cricketCoaching.newAnalysis')}
          </Button>
          
          {/* Mobile: Show score button alongside New Analysis */}
          {isMobile && analysisResult && (
            <Badge 
              className="px-3 py-2 text-sm font-bold shadow-lg transform transition-all duration-200 hover:scale-[1.05] cursor-pointer flex items-center justify-center"
              style={{
                backgroundImage: analysisResult.score >= 80 
                  ? 'linear-gradient(to right, #10B981, #059669)' 
                  : analysisResult.score >= 60
                  ? 'linear-gradient(to right, #F59E0B, #D97706)'
                  : 'linear-gradient(to right, #EF4444, #DC2626)',
                color: 'white',
                border: 'none'
              }}
            >
              Score: {analysisResult.score}/100
            </Badge>
          )}
        </div>
      </div>

      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <div className={`${isMobile ? 'flex-col space-y-3' : 'flex items-center justify-between'}`}>
                <CardTitle className="flex items-center space-x-2">
                  {analysisResult.isValid ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <span className={`${isMobile ? 'truncate' : ''}`}>{t('cricketCoaching.analysis.overallAssessment')}</span>
                </CardTitle>
                
                {/* Desktop: Show score badge on right */}
                {!isMobile && (
                  <Badge 
                    className="px-4 py-2 text-lg font-bold shadow-lg transform transition-all duration-200 hover:scale-[1.05] cursor-pointer"
                    style={{
                      backgroundImage: analysisResult.score >= 80 
                        ? 'linear-gradient(to right, #10B981, #059669)' 
                        : analysisResult.score >= 60
                        ? 'linear-gradient(to right, #F59E0B, #D97706)'
                        : 'linear-gradient(to right, #EF4444, #DC2626)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    Score: {analysisResult.score}/100
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Custom progress bar with score-based colors */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${analysisResult.score}%`,
                      backgroundImage: analysisResult.score >= 80 
                        ? 'linear-gradient(to right, #10B981, #059669)' 
                        : analysisResult.score >= 60
                        ? 'linear-gradient(to right, #F59E0B, #D97706)'
                        : 'linear-gradient(to right, #EF4444, #DC2626)'
                    }}
                  ></div>
                </div>
                <div className="flex justify-end mt-1">
                  <span 
                    className="text-sm font-semibold"
                    style={{
                      color: analysisResult.score >= 80 
                        ? '#059669' 
                        : analysisResult.score >= 60
                        ? '#D97706'
                        : '#DC2626'
                    }}
                  >
                    Score: {analysisResult.score}
                  </span>
                </div>
              </div>
              
              <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
                {analysisResult.isValid 
                  ? `Great! We successfully analyzed your ${selectedType} technique.`
                  : "There were some issues with the video analysis."
                }
              </p>
            </CardContent>
          </Card>

          {/* Feedback */}
          {analysisResult.feedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">{t('cricketCoaching.analysis.techniqueFeedback')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.feedback.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {analysisResult.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">{t('cricketCoaching.analysis.areasForImprovement')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.warnings.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {analysisResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">{t('cricketCoaching.analysis.criticalIssues')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.errors.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              {t('cricketCoaching.uploadInstructions')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="main-content flex-1 pt-8 pb-6">
        {stage === "selection" && renderTypeSelection()}
        {stage === "instructions" && renderInstructions()}
        {stage === "analyzing" && renderAnalyzing()}
        {stage === "results" && renderResults()}
      </div>

      <Footer />
    </div>
  );
}