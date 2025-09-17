import { useEffect, useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalUploadBar() {
  const { currentUpload, cancelUpload, retryUpload, resumeUpload } = useUpload();
  const { t } = useTranslation();
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success animation
  useEffect(() => {
    if (currentUpload?.status === 'completed') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUpload?.status]);

  if (!currentUpload || currentUpload.status === 'cancelled') {
    return null;
  }

  const getStatusInfo = () => {
    switch (currentUpload.status) {
      case 'uploading':
        return {
          message: t('posts.uploadingMessage'),
          bgColor: "bg-blue-500",
          textColor: "text-white",
          showCancel: true,
        };
      case 'paused':
      case 'error':
        return {
          message: currentUpload.error 
            ? t('posts.uploadFailedMessage', { error: currentUpload.error })
            : t('posts.uploadPausedMessage'),
          bgColor: "bg-orange-500",
          textColor: "text-white",
          showRetry: true,
          showCancel: true,
        };
      case 'completed':
        return {
          message: t('posts.uploadCompletedMessage'),
          bgColor: "bg-green-500",
          textColor: "text-white",
          showCancel: false,
        };
      default:
        return {
          message: t('posts.uploading'),
          bgColor: "bg-blue-500",
          textColor: "text-white",
          showCancel: true,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 shadow-sm"
        data-testid="global-upload-bar"
      >
        <div className={`${statusInfo.bgColor} ${statusInfo.textColor} px-4 py-2 relative`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 flex-1">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {currentUpload.status === 'completed' && showSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.div>
                ) : currentUpload.status === 'error' || currentUpload.status === 'paused' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                )}
              </div>

              {/* Message and Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate" data-testid="upload-message">
                    {statusInfo.message}
                  </span>
                  <span className="text-xs font-mono ml-2" data-testid="upload-progress-text">
                    {currentUpload.progress}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                {currentUpload.status !== 'completed' && (
                  <div className="w-full bg-white/20 rounded-full h-1">
                    <motion.div
                      className="bg-white h-1 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${currentUpload.progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${currentUpload.progress}%` }}
                      data-testid="upload-progress-bar"
                    />
                  </div>
                )}

                {/* Success Animation */}
                {currentUpload.status === 'completed' && showSuccess && (
                  <motion.div
                    className="w-full bg-white/20 rounded-full h-1 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="bg-white h-1 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ 
                        width: "0%",
                        transition: { duration: 2, ease: "easeInOut" }
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {statusInfo.showRetry && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={currentUpload.status === 'paused' ? resumeUpload : retryUpload}
                  className="h-7 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/20"
                  data-testid="button-retry-upload"
                >
                  {currentUpload.status === 'paused' ? t('posts.resume') : t('posts.retry')}
                </Button>
              )}
              
              {statusInfo.showCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelUpload}
                  className="h-7 w-7 p-0 hover:bg-white/20 text-white"
                  data-testid="button-cancel-upload"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b px-4 py-1">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span className="truncate" data-testid="upload-filename">
                {currentUpload.fileName}
              </span>
              <span data-testid="upload-filesize">
                {(currentUpload.fileSize / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}