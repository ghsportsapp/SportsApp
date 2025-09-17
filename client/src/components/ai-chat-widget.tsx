import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MessageCircle, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  questions?: Question[];
}

interface Question {
  id: string;
  question: string;
  answer: string;
  redirectPath: string;
  requiresVerification?: boolean;
}

const menuSections: MenuSection[] = [
  {
    id: 'features',
    title: 'What are features of SportsApp?',
    icon: '🔍'
  },
  {
    id: 'feed',
    title: 'Have questions related to Feed section?',
    icon: '📰',
    questions: [
      {
        id: 'create-post',
        question: 'How can I create a post?',
        answer: 'To create a post, go to the Feed page, click "Create Post", choose the type of content (text, photo, or video), select media, and optionally tag users. Then click "Post". Your post will be published.',
        redirectPath: '/feed'
      },
      {
        id: 'get-points',
        question: 'How can I get points?',
        answer: 'You receive 1 point whenever other users give point to your post. You cannot give points to your own posts.',
        redirectPath: '/feed'
      }
    ]
  },
  {
    id: 'drills',
    title: 'Have questions related to Do Drill and Earn section?',
    icon: '🎯',
    questions: [
      {
        id: 'upload-drill',
        question: 'How to upload a drill?',
        answer: 'Visit the Do Drill and Earn page, select a sport and drill, click "Upload Video", and submit your video. After admin approval, you will receive 10 points.',
        redirectPath: '/drills'
      }
    ]
  },
  {
    id: 'tryouts',
    title: 'Have questions related to Tryouts section?',
    icon: '🏅',
    questions: [
      {
        id: 'apply-tryouts',
        question: 'How to apply for tryouts?',
        answer: 'Navigate to the Tryouts page, select a tryout, fill in the required details, and upload your video. Once reviewed and approved, you will receive a confirmation email.',
        redirectPath: '/tryouts'
      }
    ]
  },
  {
    id: 'cricket-coaching',
    title: 'Have questions related to Cricket Coaching?',
    icon: '🏏',
    questions: [
      {
        id: 'ai-coaching',
        question: 'How can I take AI Cricket Coaching?',
        answer: 'On the Cricket Coaching page, select Batting or Bowling, upload a relevant gameplay video, and our AI will analyze and show feedback including strengths and areas to improve.',
        redirectPath: '/cricket-coaching'
      }
    ]
  },
  {
    id: 'verification',
    title: 'Have questions related to Profile Verification and Redemption Process?',
    icon: '✅',
    questions: [
      {
        id: 'get-verified',
        question: 'How do I get verified?',
        answer: 'Go to My Profile page, click "Get Verified", read the disclaimer, and request verification. Your profile must have enough sports-related content and you should be an active user.',
        redirectPath: '/profile'
      },
      {
        id: 'redeem-points',
        question: 'How to redeem points?',
        answer: 'Once verified, go to Redeem page, make sure you have at least 5 points, and click "Redeem". Enter your email ID. Team SportsApp will contact you via email.',
        redirectPath: '/profile',
        requiresVerification: true
      }
    ]
  },
  {
    id: 'profile',
    title: 'Have questions related to Profile Changes?',
    icon: '👤',
    questions: [
      {
        id: 'edit-profile',
        question: 'How can I edit my username, profile picture, etc.?',
        answer: 'On the My Profile page, click "Edit Profile", make your changes (username, photo, bio, etc.), and click "Save Changes".',
        redirectPath: '/profile'
      }
    ]
  },
  {
    id: 'language',
    title: 'How can I change my language in SportsApp?',
    icon: '🌐'
  }
];

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'section' | 'answer'>('main');
  const [selectedSection, setSelectedSection] = useState<MenuSection | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    enabled: isOpen
  });

  const goToMainMenu = () => {
    setCurrentView('main');
    setSelectedSection(null);
    setSelectedQuestion(null);
  };

  const handleSectionClick = (section: MenuSection) => {
    if (section.id === 'features') {
      setSelectedQuestion({
        id: 'features-overview',
        question: 'What are features of SportsApp?',
        answer: 'SportsApp is a social sports platform where users can create posts, participate in tryouts, upload sports drills to earn points, message other users, and redeem those points for rewards.',
        redirectPath: ''
      });
      setCurrentView('answer');
    } else if (section.id === 'language') {
      setSelectedQuestion({
        id: 'change-language',
        question: 'How can I change my language in SportsApp?',
        answer: 'Click on language from the menu, select preferred language (English or Hindi).',
        redirectPath: ''
      });
      setCurrentView('answer');
    } else if (section.questions) {
      setSelectedSection(section);
      setCurrentView('section');
    }
  };

  const handleQuestionClick = (question: Question) => {
    // Check verification requirement
    if (question.requiresVerification && question.id === 'redeem-points') {
      if (!(user as any)?.isVerified) {
        setSelectedQuestion({
          ...question,
          answer: 'You need to be verified before you can redeem.',
          redirectPath: '/profile'
        });
      } else {
        setSelectedQuestion(question);
      }
    } else {
      setSelectedQuestion(question);
    }
    setCurrentView('answer');
  };

  const handleRedirect = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const renderMainMenu = () => (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          How can I help you today?
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a section to get started
        </p>
      </div>
      
      {menuSections.map((section) => (
        <Button
          key={section.id}
          variant="outline"
          className="w-full text-left h-auto p-3 justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700 min-h-[70px]"
          onClick={() => handleSectionClick(section)}
        >
          <div className="flex items-center w-full max-w-full">
            <span className="text-lg mr-3 flex-shrink-0">{section.icon}</span>
            <span className="text-sm font-medium leading-relaxed break-words flex-1 overflow-hidden text-left whitespace-normal">{section.title}</span>
          </div>
        </Button>
      ))}
    </div>
  );

  const renderSectionQuestions = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToMainMenu}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {selectedSection?.title}
        </h4>
      </div>
      
      {selectedSection?.questions?.map((question) => (
        <Button
          key={question.id}
          variant="outline"
          className="w-full text-left h-auto p-3 justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700 min-h-[70px] flex items-center"
          onClick={() => handleQuestionClick(question)}
        >
          <div className="w-full max-w-full flex items-center justify-start">
            <span className="text-sm font-medium leading-relaxed break-words block overflow-hidden whitespace-normal text-left">{question.question}</span>
          </div>
        </Button>
      ))}
    </div>
  );

  const renderAnswer = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToMainMenu}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {selectedQuestion?.question}
        </h5>
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {selectedQuestion?.answer}
        </p>
        
        {selectedQuestion?.redirectPath && (
          <Button
            onClick={() => handleRedirect(selectedQuestion.redirectPath)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {selectedQuestion?.id === 'get-verified' || (selectedQuestion?.requiresVerification && !(user as any)?.isVerified)
              ? 'Go to Get Verified'
              : selectedQuestion?.id === 'redeem-points'
              ? 'Go to Redeem page'
              : selectedQuestion?.id === 'edit-profile'
              ? 'Go to Edit Profile'
              : selectedQuestion?.id === 'create-post' || selectedQuestion?.id === 'get-points'
              ? 'Go to Feed page'
              : selectedQuestion?.id === 'upload-drill'
              ? 'Go to Do Drill and Earn'
              : selectedQuestion?.id === 'apply-tryouts'
              ? 'Go to Tryouts page'
              : selectedQuestion?.id === 'ai-coaching'
              ? 'Go to Cricket Coaching'
              : 'Go to page'
            }
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 hover:from-slate-800 hover:via-blue-800 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 z-50 border-2 border-white ring-2 ring-white/20"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <Card className="w-full max-w-sm max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 mx-auto my-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 text-white rounded-t-lg flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ask SportsApp
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
              {currentView === 'main' && renderMainMenu()}
              {currentView === 'section' && renderSectionQuestions()}
              {currentView === 'answer' && renderAnswer()}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}