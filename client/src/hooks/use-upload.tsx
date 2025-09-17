import { createContext, ReactNode, useContext, useCallback, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadSession {
  uploadId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
  uploadedChunks: number;
  progress: number;
  postData: {
    type: string;
    content?: string;
    mentions?: string;
    tags?: string;
  };
  status: 'uploading' | 'paused' | 'error' | 'completed' | 'cancelled';
  error?: string;
}

interface UploadContextType {
  currentUpload: UploadSession | null;
  isUploading: boolean;
  startPostUpload: (data: {
    type: string;
    content?: string;
    mentions?: string;
    tags?: string;
    file: File;
  }) => Promise<void>;
  pauseUpload: () => void;
  resumeUpload: () => void;
  cancelUpload: () => void;
  retryUpload: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

const STORAGE_KEY = "sportsapp_upload_session";
const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

export function UploadProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentUpload, setCurrentUpload] = useState<UploadSession | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load upload session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCurrentUpload(session);
      } catch (error) {
        console.error("Failed to restore upload session:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save upload session to localStorage whenever it changes
  useEffect(() => {
    if (currentUpload) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUpload));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUpload]);

  const clearUpload = useCallback(() => {
    setCurrentUpload(null);
    setUploadFile(null);
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    localStorage.removeItem(STORAGE_KEY);
  }, [abortController]);

  const updateUpload = useCallback((updates: Partial<UploadSession>) => {
    setCurrentUpload(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const uploadChunk = useCallback(async (
    uploadId: string,
    chunkIndex: number,
    chunkData: Blob,
    signal: AbortSignal
  ) => {
    const formData = new FormData();
    formData.append('chunk', chunkData);
    formData.append('chunkIndex', chunkIndex.toString());

    const response = await fetch(`/api/uploads/${uploadId}`, {
      method: 'PATCH',
      body: formData,
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chunk upload failed: ${error}`);
    }

    return await response.json();
  }, []);

  const performUpload = useCallback(async (file: File, uploadData: UploadSession) => {
    const controller = new AbortController();
    setAbortController(controller);

    try {
      let startChunk = uploadData.uploadedChunks;
      
      // If resuming, get current status from server
      if (startChunk > 0) {
        try {
          const statusResponse = await fetch(`/api/uploads/${uploadData.uploadId}/status`, {
            credentials: 'include',
            signal: controller.signal,
          });

          if (statusResponse.ok) {
            const status = await statusResponse.json();
            startChunk = status.totalReceived;
            updateUpload({ uploadedChunks: startChunk, progress: status.progress });
          }
        } catch (error) {
          console.warn("Failed to get upload status:", error);
        }
      }

      // Upload remaining chunks
      for (let i = startChunk; i < uploadData.totalChunks; i++) {
        if (controller.signal.aborted) {
          throw new Error("Upload cancelled");
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        try {
          const result = await uploadChunk(uploadData.uploadId, i, chunk, controller.signal);
          
          updateUpload({ 
            uploadedChunks: result.totalReceived,
            progress: result.progress,
            status: 'uploading'
          });
        } catch (error) {
          if (controller.signal.aborted) {
            updateUpload({ status: 'cancelled' });
            return;
          }
          throw error;
        }
      }

      // Complete upload
      const completeResponse = await fetch(`/api/uploads/${uploadData.uploadId}/complete`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.text();
        throw new Error(`Upload completion failed: ${error}`);
      }

      const newPost = await completeResponse.json();

      // Update cache with new post
      queryClient.setQueryData(['/api/posts'], (old: any[]) => {
        return old ? [newPost, ...old] : [newPost];
      });

      // Invalidate to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });

      updateUpload({ status: 'completed', progress: 100 });

      // Clear upload after short delay to show success
      setTimeout(() => {
        clearUpload();
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      updateUpload({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setAbortController(null);
    }
  }, [uploadChunk, updateUpload, clearUpload]);

  const startPostUpload = useCallback(async (data: {
    type: string;
    content?: string;
    mentions?: string;
    tags?: string;
    file: File;
  }) => {
    try {
      // Initialize upload session
      const initResponse = await apiRequest("POST", "/api/uploads/init", {
        fileName: data.file.name,
        fileSize: data.file.size,
        fileType: data.file.type,
        type: data.type,
        content: data.content,
        mentions: data.mentions,
        tags: data.tags,
      });

      const { uploadId, totalChunks } = await initResponse.json();

      const uploadSession: UploadSession = {
        uploadId,
        fileName: data.file.name,
        fileSize: data.file.size,
        fileType: data.file.type,
        totalChunks,
        uploadedChunks: 0,
        progress: 0,
        postData: {
          type: data.type,
          content: data.content,
          mentions: data.mentions,
          tags: data.tags,
        },
        status: 'uploading'
      };

      setCurrentUpload(uploadSession);
      setUploadFile(data.file);

      // Start uploading
      performUpload(data.file, uploadSession);

    } catch (error) {
      console.error("Failed to start upload:", error);
      toast({
        title: "Upload failed to start",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [performUpload, toast]);

  const pauseUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    updateUpload({ status: 'paused' });
  }, [abortController, updateUpload]);

  const resumeUpload = useCallback(() => {
    if (currentUpload && uploadFile && currentUpload.status === 'paused') {
      updateUpload({ status: 'uploading' });
      performUpload(uploadFile, currentUpload);
    }
  }, [currentUpload, uploadFile, performUpload, updateUpload]);

  const cancelUpload = useCallback(async () => {
    if (!currentUpload) return;

    // Abort current upload
    if (abortController) {
      abortController.abort();
    }

    // Cancel on server
    try {
      await fetch(`/api/uploads/${currentUpload.uploadId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Failed to cancel upload on server:", error);
    }

    clearUpload();
  }, [currentUpload, abortController, clearUpload]);

  const retryUpload = useCallback(() => {
    if (currentUpload && uploadFile && currentUpload.status === 'error') {
      updateUpload({ status: 'uploading', error: undefined });
      performUpload(uploadFile, currentUpload);
    }
  }, [currentUpload, uploadFile, performUpload, updateUpload]);

  const isUploading = currentUpload?.status === 'uploading';

  return (
    <UploadContext.Provider
      value={{
        currentUpload,
        isUploading,
        startPostUpload,
        pauseUpload,
        resumeUpload,
        cancelUpload,
        retryUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}