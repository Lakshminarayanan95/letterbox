import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Music, 
  Image as ImageIcon, 
  Send, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  Edit3,
  Lock,
  Copy,
  Check,
  Share2,
  Video,
  Palette,
  Sparkles,
  Moon,
  Leaf,
  Type as TypeIcon,
  AlertCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  name: string;
  file?: File;
}

interface Theme {
  id: string;
  name: string;
  bg: string;
  paper: string;
  accent: string;
  text: string;
  font: string;
  secondary: string;
}

const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Victorian Classic',
    bg: 'bg-[#fdf8f3]',
    paper: 'bg-[#fffcf7]',
    accent: 'text-rose-600',
    text: 'text-[#2c2420]',
    font: 'font-serif',
    secondary: 'text-[#a89078]'
  },
  {
    id: 'midnight',
    name: 'Midnight Romance',
    bg: 'bg-[#0f172a]',
    paper: 'bg-[#1e293b]',
    accent: 'text-indigo-400',
    text: 'text-slate-200',
    font: 'font-serif',
    secondary: 'text-slate-400'
  },
  {
    id: 'botanical',
    name: 'Botanical Garden',
    bg: 'bg-[#f1f5f1]',
    paper: 'bg-[#ffffff]',
    accent: 'text-emerald-700',
    text: 'text-[#1a2e1a]',
    font: 'font-serif',
    secondary: 'text-emerald-900/40'
  },
  {
    id: 'parchment',
    name: 'Aged Parchment',
    bg: 'bg-[#f4ead5]',
    paper: 'bg-[#faf3e0]',
    accent: 'text-[#5d4037]',
    text: 'text-[#3e2723]',
    font: 'font-serif',
    secondary: 'text-[#8d6e63]'
  }
];

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

interface PolaroidProps {
  src: string;
  caption?: string;
  onDelete?: () => void;
  isPreview?: boolean;
}

const Polaroid: React.FC<PolaroidProps & { type?: 'image' | 'video' }> = ({ src, caption, onDelete, isPreview, type = 'image' }) => (
  <motion.div 
    initial={{ rotate: Math.random() * 6 - 3, scale: 0.9, opacity: 0 }}
    animate={{ rotate: Math.random() * 6 - 3, scale: 1, opacity: 1 }}
    className="bg-white p-3 pb-8 polaroid-shadow inline-block relative group"
  >
    {!isPreview && onDelete && (
      <button 
        onClick={onDelete}
        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={14} />
      </button>
    )}
    <div className="w-48 h-48 overflow-hidden bg-gray-100 border border-gray-200 relative">
      {type === 'video' ? (
        <video 
          src={src} 
          className="w-full h-full object-cover" 
          autoPlay 
          muted 
          loop 
          playsInline
        />
      ) : (
        <img src={src} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
      )}
    </div>
    {caption && <p className="mt-4 text-center font-body text-xs italic text-gray-600">{caption}</p>}
  </motion.div>
);

const GramophoneDisc = ({ isPlaying, hasAudio }: { isPlaying: boolean; hasAudio: boolean }) => (
  <div className="relative w-48 h-48 mx-auto">
    <div 
      className={cn(
        "w-full h-full rounded-full bg-[#1a1a1a] border-4 border-[#2a2a2a] flex items-center justify-center relative shadow-2xl",
        isPlaying ? "animate-spin-slow" : "",
        !hasAudio && "opacity-50"
      )}
    >
      {/* Grooves */}
      <div className="absolute inset-2 rounded-full border border-white/5" />
      <div className="absolute inset-6 rounded-full border border-white/5" />
      <div className="absolute inset-10 rounded-full border border-white/5" />
      <div className="absolute inset-14 rounded-full border border-white/5" />
      
      {/* Label */}
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
        <Heart className={cn("text-rose-400 fill-rose-400", isPlaying && "animate-pulse")} size={24} />
      </div>
    </div>
  </div>
);

export default function App() {
  const [letterText, setLetterText] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [isSealed, setIsSealed] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [presentTime, setPresentTime] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingLetter, setIsLoadingLetter] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [sharedMelody, setSharedMelody] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const letterId = params.get('id');
    if (letterId) {
      loadLetter(letterId);
    }
  }, []);

  const loadLetter = async (id: string) => {
    setIsLoadingLetter(true);
    try {
      const docRef = doc(db, 'letters', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLetterText(data.text || "");
        setCustomSongTitle(data.songTitle || "");
        
        if (data.themeId) {
          const theme = THEMES.find(t => t.id === data.themeId);
          if (theme) setCurrentTheme(theme);
        }
        
        if (data.media && Array.isArray(data.media)) {
          setMediaItems(data.media.map((m: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            type: m.type,
            url: m.url,
            name: m.name
          })));
        }

        // Use a default Victorian piano melody for shared letters if no audio was uploaded
        const hasAudio = data.media?.some((m: any) => m.type === 'audio');
        if (!hasAudio) {
          setSharedMelody("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"); 
        }
        setIsPreviewMode(true);
      }
    } catch (error) {
      console.error("Error loading letter:", error);
    } finally {
      setIsLoadingLetter(false);
    }
  };

  const handleSend = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    setUploadStatus("Preparing your memories...");
    try {
      const filesToUpload = mediaItems.filter(item => item.file);
      const totalFiles = filesToUpload.length;
      let uploadedCount = 0;

      // Try to sign in anonymously if not already signed in
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Auth failed, proceeding as guest:", err);
        }
      }

      // Parallelize uploads for better performance
      const uploadPromises = mediaItems.map(async (item) => {
        if (item.file) {
          try {
            const storageRef = ref(storage, `letters/${Date.now()}_${item.name}`);
            const snapshot = await uploadBytes(storageRef, item.file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            uploadedCount++;
            if (totalFiles > 0) {
              setUploadProgress((uploadedCount / totalFiles) * 100);
            }
            
            return {
              type: item.type,
              url: downloadURL,
              name: item.name
            };
          } catch (error) {
            console.error(`Error uploading ${item.name}:`, error);
            throw new Error(`Failed to upload ${item.name}. Please check your connection.`);
          }
        } else {
          return {
            type: item.type,
            url: item.url,
            name: item.name
          };
        }
      });

      setUploadStatus("Carrying your memories to the clouds...");
      const uploadedMedia = await Promise.all(uploadPromises);

      setUploadStatus("Sealing the envelope with wax...");
      
      let docRef;
      try {
        docRef = await addDoc(collection(db, 'letters'), {
          text: letterText,
          songTitle: customSongTitle || (activeAudio ? activeAudio.name : ""),
          date: formatPresentTime(presentTime),
          media: uploadedMedia,
          themeId: currentTheme.id,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'letters');
        return; // handleFirestoreError throws, but for TS
      }
      
      setUploadStatus("Your letter is ready for delivery.");
      const url = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
      setShareLink(url);
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'A Victorian Love Letter',
            text: 'I have crafted a timeless message for you...',
            url: url,
          });
        } catch (err) {
          console.log('Share failed or cancelled', err);
        }
      }
      
      // Success: close after a short delay so they see the "ready" message
      setTimeout(() => {
        setIsSaving(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error: any) {
      console.error("Error saving letter:", error);
      let displayError = "Something went wrong. Please try again.";
      
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) displayError = parsed.error;
      } catch (e) {
        displayError = error.message || displayError;
      }

      setUploadStatus(displayError);
      // Keep overlay open for 4 seconds to show error
      setTimeout(() => {
        setIsSaving(false);
        setUploadProgress(0);
      }, 4000);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setPresentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatPresentTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const onDrop = (acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map(file => {
      let type: 'image' | 'audio' | 'video' = 'image';
      if (file.type.startsWith('audio')) type = 'audio';
      else if (file.type.startsWith('video')) type = 'video';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ""),
        file // Store the original file for uploading
      };
    });
    setMediaItems(prev => [...prev, ...newItems]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'audio/*': [],
      'video/*': []
    }
  } as any);

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const activeAudio = mediaItems.find(item => item.type === 'audio');
  const currentAudioUrl = activeAudio?.url || sharedMelody;
  const currentSongTitle = customSongTitle || (activeAudio ? activeAudio.name : "");

  useEffect(() => {
    if (audioRef.current && activeAudio) {
      audioRef.current.src = activeAudio.url;
    }
  }, [activeAudio]);

  const handleSeal = () => {
    setIsSealed(true);
    setTimeout(() => {
      setIsPreviewMode(true);
    }, 1500);
  };

  const handleUnseal = () => {
    setIsSealed(false);
    setIsPreviewMode(false);
  };

  const visualMedia = mediaItems.filter(item => item.type === 'image' || item.type === 'video');

  return (
    <div className={cn("min-h-screen pt-20 md:pt-32 pb-12 px-4 md:px-8 transition-colors duration-1000", currentTheme.bg)}>
      <audio ref={audioRef} src={currentAudioUrl || undefined} onEnded={() => setIsPlaying(false)} preload="none" />

      {/* Sealing Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#fffcf7]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-md w-full"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-[#a89078] rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="text-[#8b0000] fill-[#8b0000] animate-pulse" size={32} />
                </div>
              </div>
              
              <h2 className="font-display text-3xl text-[#4a3728] mb-4 italic">Sealing your message...</h2>
              <p className="font-serif text-[#6d5a4a] italic mb-8 h-8">
                {uploadStatus}
              </p>
              
              <div className="w-full h-1 bg-[#e5dcd3] rounded-full overflow-hidden mb-2">
                <motion.div 
                  className="h-full bg-[#8b0000]"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[#a89078] uppercase tracking-[0.2em] mb-8">
                {Math.round(uploadProgress)}% Complete
              </p>

              <button 
                onClick={() => setIsSaving(false)}
                className="text-[#8b0000] font-serif italic text-sm hover:underline"
              >
                Cancel and return to writing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn("font-display text-4xl md:text-7xl mb-4 italic", currentTheme.text)}
          >
            Whispers of the Heart
          </motion.h1>
          <div className={cn("h-px w-32 mx-auto mb-4", currentTheme.id === 'midnight' ? 'bg-slate-400/30' : 'bg-[#4a3728]/30')} />
          <p className={cn("font-serif text-lg italic", currentTheme.secondary)}>
            Crafting a timeless message for your beloved...
          </p>
        </header>

        {isLoadingLetter && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#a89078] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-serif italic text-[#6d5a4a]">Unsealing your message...</p>
          </div>
        )}

        {!isLoadingLetter && (
          <AnimatePresence mode="wait">
          {!isPreviewMode ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12"
            >
              {/* Theme Selector */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentTheme(theme)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs uppercase tracking-widest font-bold",
                      currentTheme.id === theme.id 
                        ? "bg-[#4a3728] text-white border-[#4a3728] shadow-lg scale-105" 
                        : "bg-white/50 text-[#a89078] border-[#e5dcd3] hover:bg-white"
                    )}
                  >
                    {theme.id === 'classic' && <Sparkles size={14} />}
                    {theme.id === 'midnight' && <Moon size={14} />}
                    {theme.id === 'botanical' && <Leaf size={14} />}
                    {theme.id === 'parchment' && <TypeIcon size={14} />}
                    {theme.name}
                  </button>
                ))}
              </div>

              {/* Editor Section */}
              <section className={cn("p-8 md:p-12 rounded-lg shadow-xl border border-[#e5dcd3] relative transition-colors duration-500", currentTheme.paper)}>
                
                {/* Gramophone in Editor */}
                <div className="absolute -top-16 -right-2 md:-top-24 md:right-0 z-20 scale-65 sm:scale-75 md:scale-90 lg:scale-100 origin-top-right">
                  <div className="flex flex-col items-center">
                    <GramophoneDisc isPlaying={isPlaying} hasAudio={!!currentAudioUrl} />
                    <div className={cn("mt-4 flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-[#e5dcd3] shadow-sm", currentTheme.paper)}>
                      <button 
                        onClick={togglePlay}
                        disabled={!currentAudioUrl}
                        className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-all shadow-md", currentTheme.id === 'midnight' ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-[#4a3728] text-white hover:bg-[#6d5a4a]')}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      <div className="text-left min-w-[60px] sm:min-w-[80px]">
                        <p className={cn("text-[7px] sm:text-[8px] uppercase tracking-widest font-bold", currentTheme.secondary)}>
                          {currentAudioUrl ? "Now Playing" : "No Melody"}
                        </p>
                        <input
                          type="text"
                          value={currentSongTitle}
                          onChange={(e) => setCustomSongTitle(e.target.value)}
                          placeholder="Song Title..."
                          className={cn("bg-transparent border-none p-0 text-[9px] sm:text-[10px] focus:ring-0 w-[80px] sm:w-[100px]", currentTheme.font, currentTheme.text)}
                        />
                        <p className={cn("text-[6px] sm:text-[7px] font-mono mt-0.5 whitespace-nowrap", currentTheme.secondary)}>
                          {formatPresentTime(presentTime)}
                        </p>
                      </div>
                      {!activeAudio && (
                        <button 
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                          className={cn("p-1.5 sm:p-2 text-white rounded-full transition-all shadow-sm", currentTheme.id === 'midnight' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-[#a89078] hover:bg-[#6d5a4a]')}
                          title="Add Song"
                        >
                          <Music size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <textarea
                  value={letterText}
                  onChange={(e) => setLetterText(e.target.value)}
                  placeholder="My Dearest..."
                  className={cn("w-full min-h-[600px] md:min-h-[800px] bg-transparent border-none focus:ring-0 text-lg md:text-xl leading-[2.5rem] placeholder:text-[#a89078]/50 resize-none pr-24 sm:pr-32 md:pr-48 ruled-lines", currentTheme.font, currentTheme.text)}
                />

                {/* Media Grid in Editor */}
                <div className="mt-8 flex flex-wrap gap-6 justify-center">
                  {visualMedia.map((item) => (
                    <Polaroid 
                      key={item.id} 
                      src={item.url} 
                      type={item.type as 'image' | 'video'}
                      onDelete={() => removeMedia(item.id)} 
                    />
                  ))}
                </div>
              </section>

              {/* Upload Section */}
              <section className="max-w-2xl mx-auto w-full">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed border-[#a89078] rounded-xl p-6 md:p-12 text-center cursor-pointer transition-colors",
                    isDragActive ? "bg-[#f5efe9] border-[#6d5a4a]" : "hover:bg-[#f5efe9]/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3 md:gap-4">
                    <div className="flex gap-2">
                      <ImageIcon className="text-[#a89078]" size={24} md:size={32} />
                      <Video className="text-[#a89078]" size={24} md:size={32} />
                      <Music className="text-[#a89078]" size={24} md:size={32} />
                    </div>
                    <p className="font-serif text-[#6d5a4a] text-sm md:text-base">
                      {isDragActive ? "Drop your memories here..." : "Share your polaroids, videos, and melodies..."}
                    </p>
                    <span className="text-[10px] text-[#a89078] uppercase tracking-widest">Click or Drag & Drop</span>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="flex justify-center pt-4 md:pt-8">
                <button 
                  onClick={handleSeal}
                  className="group relative px-8 md:px-12 py-3 md:py-4 bg-[#8b0000] text-white rounded-full font-display text-lg md:text-xl italic hover:bg-[#a00000] transition-all shadow-xl flex items-center gap-3"
                >
                  <Lock size={18} md:size={20} className="group-hover:scale-110 transition-transform" />
                  Seal with Love
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Receiver's View */}
              <div className={cn("p-6 sm:p-12 md:p-20 rounded-sm shadow-2xl border border-[#e5dcd3] relative overflow-hidden transition-colors duration-500", currentTheme.paper)}>
                {/* Decorative Corners */}
                <div className={cn("absolute top-0 left-0 w-8 h-8 sm:w-16 sm:h-16 border-t-2 border-l-2 m-2 sm:m-4 opacity-30", currentTheme.id === 'midnight' ? 'border-slate-400' : 'border-[#a89078]')} />
                <div className={cn("absolute top-0 right-0 w-8 h-8 sm:w-16 sm:h-16 border-t-2 border-r-2 m-2 sm:m-4 opacity-30", currentTheme.id === 'midnight' ? 'border-slate-400' : 'border-[#a89078]')} />
                <div className={cn("absolute bottom-0 left-0 w-8 h-8 sm:w-16 sm:h-16 border-b-2 border-l-2 m-2 sm:m-4 opacity-30", currentTheme.id === 'midnight' ? 'border-slate-400' : 'border-[#a89078]')} />
                <div className={cn("absolute bottom-0 right-0 w-8 h-8 sm:w-16 sm:h-16 border-b-2 border-r-2 m-2 sm:m-4 opacity-30", currentTheme.id === 'midnight' ? 'border-slate-400' : 'border-[#a89078]')} />

                <div className="max-w-2xl mx-auto">
                  <div className="mb-8 md:mb-12 text-center">
                    <Heart className={cn("mx-auto mb-4", currentTheme.id === 'midnight' ? 'text-indigo-400 fill-indigo-400' : 'text-rose-600 fill-rose-600')} size={24} md:size={32} />
                    <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-transparent to-transparent", currentTheme.id === 'midnight' ? 'via-slate-400/50' : 'via-[#a89078]/50')} />
                  </div>

                  <div className={cn("whitespace-pre-wrap text-xl md:text-2xl leading-[2.5rem] first-letter:text-4xl md:first-letter:text-5xl first-letter:font-display first-letter:mr-1 first-letter:float-left ruled-lines", currentTheme.font, currentTheme.text)}>
                    {letterText || "A silent message of love..."}
                  </div>

                  {/* Preview Media Grid */}
                  <div className="mt-12 md:mt-20 flex flex-col gap-8 md:gap-0">
                    {visualMedia.map((item, index) => {
                      const positionClass = 
                        index % 3 === 0 ? "self-start ml-0 md:ml-4" :
                        index % 3 === 1 ? "self-end mr-0 md:mr-4" :
                        "self-start ml-0 md:ml-16";
                      
                      return (
                        <div 
                          key={item.id} 
                          className={cn(
                            "relative transition-transform duration-500 hover:z-30",
                            positionClass,
                            index > 0 && "md:-mt-24"
                          )}
                        >
                          <Polaroid 
                            src={item.url} 
                            type={item.type as 'image' | 'video'}
                            isPreview
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Preview Music */}
                  {(currentAudioUrl || currentSongTitle) && (
                    <div className="mt-12 md:mt-20 text-center">
                      <div className="mb-8 scale-75 sm:scale-100">
                        <GramophoneDisc isPlaying={isPlaying} hasAudio={!!currentAudioUrl} />
                        <p className={cn("mt-4 text-base md:text-lg italic", currentTheme.font, currentTheme.text)}>
                          {currentSongTitle || "A Secret Melody"}
                        </p>
                        <p className={cn("text-[10px] md:text-xs font-mono mt-1", currentTheme.secondary)}>
                          {formatPresentTime(presentTime)}
                        </p>
                      </div>
                      <button 
                        onClick={togglePlay}
                        disabled={!currentAudioUrl}
                        className={cn("px-6 md:px-8 py-2.5 md:py-3 text-white rounded-full italic transition-all shadow-lg flex items-center gap-3 mx-auto text-sm md:text-base disabled:opacity-50", currentTheme.id === 'midnight' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-[#4a3728] hover:bg-[#6d5a4a]')}
                      >
                        {isPlaying ? <Pause size={16} md:size={18} /> : <Play size={16} md:size={18} />}
                        {isPlaying ? "Pause the Melody" : "Listen to My Heart"}
                      </button>
                    </div>
                  )}

                  <div className="mt-12 md:mt-20 text-center font-display text-2xl md:text-3xl text-[#4a3728] italic">
                    Yours Eternally.
                  </div>
                </div>
              </div>

              {/* Preview Controls */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-[#6d5a4a] italic font-serif text-sm md:text-base">Receiver's Perspective</p>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                  <button 
                    onClick={handleUnseal}
                    className="px-6 md:px-8 py-2.5 md:py-3 bg-white border border-[#a89078] text-[#4a3728] rounded-full font-serif italic hover:bg-[#f5efe9] transition-all flex items-center gap-2 text-sm md:text-base"
                  >
                    <Edit3 size={16} md:size={18} />
                    Return to Writing
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={isSaving}
                    className="px-6 md:px-8 py-2.5 md:py-3 bg-[#4a3728] text-white rounded-full font-serif italic hover:bg-[#6d5a4a] transition-all flex items-center gap-2 text-sm md:text-base disabled:opacity-50"
                  >
                    <Send size={16} md:size={18} />
                    {shareLink ? "Link Generated" : "Send This Letter"}
                  </button>
                </div>

                {shareLink && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-white rounded-lg border border-[#e5dcd3] shadow-inner w-full max-w-md mx-auto"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[#a89078] font-bold mb-2 text-center">Your Shareable Link</p>
                    <div className="flex items-center gap-2 bg-[#f5efe9] p-2 rounded border border-[#e5dcd3]">
                      <input 
                        type="text" 
                        readOnly 
                        value={shareLink} 
                        className="bg-transparent border-none text-xs font-mono text-[#4a3728] flex-1 focus:ring-0 overflow-hidden text-ellipsis"
                      />
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 text-[#4a3728] hover:bg-white/50 rounded transition-colors"
                        title="Copy to Clipboard"
                      >
                        {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Footer Decoration */}
        <footer className="mt-24 text-center pb-12">
          <div className="flex justify-center gap-4 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#a89078]/40" />
            <div className="w-2 h-2 rounded-full bg-[#a89078]/40" />
            <div className="w-2 h-2 rounded-full bg-[#a89078]/40" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#a89078] font-bold">
            Est. 1837 — Victorian Love Letters
          </p>
          <p className="text-[9px] text-[#a89078]/60 mt-2 italic">
            Optimized for one-time heartfelt messages. Free plan active.
          </p>
        </footer>
      </div>

      {/* Wax Seal Overlay for Sealing Animation */}
      <AnimatePresence>
        {isSealed && !isPreviewMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#2c2420]/90 flex items-center justify-center backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="relative"
            >
              <div className="w-48 h-48 bg-[#8b0000] rounded-full shadow-2xl flex items-center justify-center border-4 border-[#a00000] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <Heart className="text-white fill-white" size={80} />
              </div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white font-display text-3xl italic mt-8 text-center"
              >
                Sealed with love...
              </motion.p>
              <button 
                onClick={() => setIsPreviewMode(true)}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-white/50 text-xs hover:text-white transition-colors uppercase tracking-widest"
              >
                Skip Animation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
