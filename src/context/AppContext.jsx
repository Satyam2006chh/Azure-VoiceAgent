import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INDIAN_LANGUAGES } from '../data/indianLanguages';
import { INITIAL_CONVERSATION } from '../data/mockConversations';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validRoutes = ['about', 'assistant', 'architecture', 'knowledge', 'technology', 'security', 'team', 'admin'];
    return validRoutes.includes(hash) ? hash : 'about';
  });
  const [selectedLanguage, setSelectedLanguage] = useState(INDIAN_LANGUAGES[0]);
  const [voiceState, setVoiceState] = useState('idle');
  const [userRole, setUserRole] = useState('student');
  const [fallbackMode, setFallbackMode] = useState('none');
  const [messages, setMessages] = useState(INITIAL_CONVERSATION);
  const [activeCitation, setActiveCitation] = useState(null);
  const [activeArchitectureNode, setActiveArchitectureNode] = useState(null);
  const [activeKnowledgeDoc, setActiveKnowledgeDoc] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackAudioText, setPlaybackAudioText] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Ref to abort in-flight requests when user logs out mid-voice
  const abortControllerRef = useRef(null);

  // ── Authentication & Daily Quota State ──
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('univoice_auth_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('univoice_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({
    daily_limit: 5,
    used_today: 0,
    remaining_today: 5,
    role: 'visitor'
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''; // Vite proxy forwards /api -> http://localhost:8000

  // Sync user profile on mount / token change
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authToken) {
        setUser(null);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.quota) {
            setQuotaInfo(data.user.quota);
          }
          if (data.user?.role) {
            setUserRole(data.user.role);
          }
          localStorage.setItem('univoice_user_profile', JSON.stringify(data.user));
        } else if (res.status === 401) {
          // Token expired or invalid
          logoutUser();
        }
      } catch (e) {
        console.warn('Failed to fetch user profile:', e);
      }
    };
    fetchUserProfile();
  }, [authToken]);

  const loginUser = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('univoice_auth_token', token);
    localStorage.setItem('univoice_user_profile', JSON.stringify(userData));
    if (userData?.quota) {
      setQuotaInfo(userData.quota);
    }
    if (userData?.role) {
      setUserRole(userData.role);
    }
  };

  const registerUserWithOtp = (token, userData) => {
    loginUser(token, userData);
  };

  const logoutUser = () => {
    // Abort any in-flight API call immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('univoice_auth_token');
    localStorage.removeItem('univoice_user_profile');
    setQuotaInfo({ daily_limit: 5, used_today: 0, remaining_today: 5, role: 'visitor' });
    // Stop any ongoing voice/audio state
    setVoiceState('idle');
    setIsPlayingAudio(false);
    setPlaybackAudioText(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Sync hash with route if available
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validRoutes = ['about', 'assistant', 'architecture', 'knowledge', 'technology', 'security', 'team', 'admin'];
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSelectedLanguageCode = (code) => {
    const found = INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[0];
    setSelectedLanguage(found);
  };

  const adminLogin = (email, password) => {
    if (email === 'admin@gmail.com' && password === 'admin123') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    navigateTo('about');
  };

  const addMessage = (message) => {
    setMessages((prev) => {
      let realMessages = prev.filter(m => !INITIAL_CONVERSATION.find(initM => initM.id === m.id));
      if (message.sender === 'user' && realMessages.length >= 6) {
        realMessages = [];
      }
      return [...realMessages, message];
    });
  };

  const resetConversation = () => {
    setMessages(INITIAL_CONVERSATION);
    setVoiceState('idle');
    setIsPlayingAudio(false);
  };

  // Play base64 audio from Sarvam TTS
  const playAudioFromBase64 = (base64Audio) => {
    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(() => {});
      audio.onended = () => {
        setIsPlayingAudio(false);
        setVoiceState('idle');
        URL.revokeObjectURL(url);
      };
    } catch {
      setIsPlayingAudio(false);
      setVoiceState('idle');
    }
  };

  const triggerVoiceQuerySimulation = async (customPrompt, customLang) => {
    // Gatekeep if not authenticated
    if (!authToken) {
      openAuthModal();
      return;
    }

    const lang = customLang
      ? INDIAN_LANGUAGES.find((l) => l.code === customLang) || selectedLanguage
      : selectedLanguage;

    const queryText = customPrompt || lang.samplePrompt;

    // Step 1: Listening state
    setVoiceState('listening');

    setTimeout(async () => {
      // Step 2: Transcribing state
      setVoiceState('transcribing');

      // Add user message immediately
      const userMsg = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: lang.code,
        text: queryText,
        audioDurationSeconds: 3.5,
        transcriptionConfidence: 0.985,
      };
      addMessage(userMsg);

      // Step 3: Reasoning state — call real backend with Auth Token
      setVoiceState('reasoning');

      try {
        // Create fresh abort controller for this request
        abortControllerRef.current = new AbortController();
        const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            query: queryText,
            language_code: lang.locale || lang.code,
            user_role: userRole,
            generate_audio: true,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            openAuthModal();
            throw {
              type: 'AuthenticationRequired',
              message: 'Your session has expired. Please sign in again.',
              subsystem: 'Identity Firewall'
            };
          }
          if (response.status === 429) {
            throw {
              type: 'QuotaExhausted',
              message: errData.detail?.message || 'Daily query quota exhausted! Please check back tomorrow.',
              subsystem: 'Quota Limiter'
            };
          }
          throw {
            type: errData.error_type || 'BackendError',
            message: errData.detail?.message || errData.message || `Backend returned HTTP ${response.status}`,
            subsystem: errData.subsystem || 'FastAPI',
            path: errData.path || '/api/chat/message',
          };
        }

        const data = await response.json();

        // Update live quota info
        if (data.user_quota) {
          setQuotaInfo(data.user_quota);
        }

        const assistantMsg = {
          id: `msg-${Date.now()}-ast`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: lang.code,
          text: data.response_text,
          isOutOfScope: data.is_out_of_scope,
          toolUsed: data.tool_used,
          citations: (data.citations || []).map((c, i) => ({
            id: `cite-${Date.now()}-${i}`,
            docTitle: c.title,
            category: c.source_type,
            section: c.section,
            confidence: c.relevance_score || 0.95,
            accessLevel: 'public',
          })),
          trace: [
            { step: 1, layer: 'STT Transcription', azureService: `Sarvam saaras:v3 (${lang.name})`, latencyMs: 80, detail: `Input: "${queryText}"`, status: 'completed' },
            { step: 2, layer: 'Identity & Quota Firewall', azureService: `Chitkara Auth Shield (${quotaInfo.remaining_today} Left)`, latencyMs: 4, detail: `User: ${user?.email || 'Authenticated'}`, status: 'completed' },
            { step: 3, layer: 'Intent Guardrail', azureService: 'Azure OpenAI GPT-4.1-mini Router', latencyMs: 2, detail: data.telemetry?.guardrail?.llm_reasoning || 'PASSED_IN_SCOPE', status: 'completed' },
            { step: 4, layer: 'Tool / RAG Search', azureService: data.tool_used || 'Azure AI Search RAG', latencyMs: 10, detail: `Tool: ${data.tool_used || 'RAG Retrieval'}`, status: 'completed' },
            { step: 5, layer: 'TTS Synthesis', azureService: `${data.telemetry?.tts?.provider || 'Dual TTS'} (${lang.name})`, latencyMs: data.telemetry?.tts?.status_code === 200 ? 180 : 0, detail: `Voice synthesized in ${lang.name}`, status: 'completed' },
          ],
          telemetry: data.telemetry,
        };

        addMessage(assistantMsg);
        setVoiceState('speaking');
        setIsPlayingAudio(true);
        setPlaybackAudioText(data.response_text);

        if (data.audio_base64) {
          playAudioFromBase64(data.audio_base64);
        } else {
          setTimeout(() => {
            setVoiceState('idle');
            setIsPlayingAudio(false);
          }, 3000);
        }

      } catch (err) {
        // Ignore abort errors — user voluntarily logged out
        if (err?.name === 'AbortError') return;
        const isStructuredError = err && err.type;
        const assistantMsg = {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: lang.code,
          text: isStructuredError
            ? `Unable to process request: ${err.message}`
            : 'The university assistant backend is currently unreachable. Please ensure the FastAPI server is running.',
          isErrorFallback: true,
          errorReason: isStructuredError
            ? `${err.type} — ${err.subsystem || 'Backend'}: ${err.message}`
            : `Network Error: Cannot connect to backend server.`,
          errorType: err?.type || 'NetworkError',
          errorSubsystem: err?.subsystem || 'FastAPI Gateway',
        };
        addMessage(assistantMsg);
        setVoiceState('idle');
        setIsPlayingAudio(false);
      }
    }, 900);
  };

  const convertToWav = async (webmBlob) => {
    try {
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const numChannels = 1;
      const sampleRate = 16000;
      const length = audioBuffer.length * numChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);
      
      const channelData = audioBuffer.getChannelData(0);
      let offset = 44;
      for (let i = 0; i < audioBuffer.length; i++) {
        let sample = Math.max(-1, Math.min(1, channelData[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
      
      return new Blob([view], { type: 'audio/wav' });
    } catch (err) {
      console.error("WAV conversion failed", err);
      return webmBlob;
    }
  };
  const processVoiceAudio = async (audioBlob, provider = 'sarvam') => {
    if (!authToken) {
      openAuthModal();
      return;
    }

    setVoiceState('transcribing');
    try {
      const processedBlob = await convertToWav(audioBlob);
      const formData = new FormData();
      formData.append('audio', processedBlob, processedBlob.type === 'audio/wav' ? 'recording.wav' : 'recording.webm');
      formData.append('language_code', selectedLanguage.locale || selectedLanguage.code);
      formData.append('provider', provider);

      // Create abort controller for this voice pipeline
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const sttResponse = await fetch(`${BACKEND_URL}/api/voice/stt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        signal,
        body: formData,
      });

      if (!sttResponse.ok) {
        if (sttResponse.status === 401) {
          openAuthModal();
          throw new Error('Please sign in to use the voice assistant.');
        }
        throw new Error(`STT API Error: ${sttResponse.status}`);
      }

      const sttData = await sttResponse.json();
      const transcribedText = sttData.transcript || '';

      if (!transcribedText) throw new Error('No speech detected. Please speak clearly and try again.');

      // Show user message with real transcription
      const userMsg = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage.code,
        text: transcribedText,
        audioDurationSeconds: 0,
        transcriptionConfidence: sttData.telemetry?.confidence || 0.95,
      };
      addMessage(userMsg);

      // Route to AI reasoning pipeline with Auth
      setVoiceState('reasoning');
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        signal,
        body: JSON.stringify({
          query: transcribedText,
          language_code: selectedLanguage.locale || selectedLanguage.code,
          user_role: userRole,
          generate_audio: true,
          provider: provider,
        }),
      });

      if (!chatResponse.ok) {
        const errJson = await chatResponse.json().catch(() => ({}));
        if (chatResponse.status === 429) {
          throw new Error(errJson.detail?.message || 'Daily query quota limit reached!');
        }
        throw new Error(`Chat API Error: ${chatResponse.status}`);
      }

      const data = await chatResponse.json();

      if (data.user_quota) {
        setQuotaInfo(data.user_quota);
      }

      const assistantMsg = {
        id: `msg-${Date.now()}-ast`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage.code,
        text: data.response_text,
        isOutOfScope: data.is_out_of_scope,
        toolUsed: data.tool_used,
        citations: (data.citations || []).map((c, i) => ({
          id: `cite-${Date.now()}-${i}`,
          docTitle: c.title,
          category: c.source_type,
          section: c.section,
          confidence: c.relevance_score || 0.92,
          accessLevel: 'public',
        })),
        trace: [
          { step: 1, layer: 'STT', azureService: `Sarvam saaras:v3 (${selectedLanguage.name})`, latencyMs: 140, detail: `Transcribed: "${transcribedText}"`, status: 'completed' },
          { step: 2, layer: 'Identity & Quota Firewall', azureService: `Chitkara Auth Shield (${quotaInfo.remaining_today} Left)`, latencyMs: 4, detail: `User: ${user?.email || 'Authenticated'}`, status: 'completed' },
          { step: 3, layer: 'Intent Guardrail', azureService: 'Azure OpenAI GPT-4.1-mini Router', latencyMs: 2, detail: data.telemetry?.guardrail?.llm_reasoning || 'PASSED_IN_SCOPE', status: 'completed' },
          { step: 4, layer: 'Tool / RAG', azureService: data.tool_used || 'RAG Ordinances', latencyMs: 10, detail: `Tool: ${data.tool_used || 'RAG Retrieval'}`, status: 'completed' },
          { step: 5, layer: 'TTS Synthesis', azureService: `${provider === 'azure' ? 'Azure Neural TTS (Male Voice)' : 'Sarvam bulbul:v3'} (${selectedLanguage.name})`, latencyMs: 180, detail: `Voice synthesized via ${provider === 'azure' ? 'Azure AI Speech' : 'Sarvam AI'} in ${selectedLanguage.name}`, status: 'completed' },
        ],
        telemetry: data.telemetry,
      };

      addMessage(assistantMsg);
      setVoiceState('speaking');
      setIsPlayingAudio(true);
      setPlaybackAudioText(data.response_text);

      if (data.audio_base64) {
        playAudioFromBase64(data.audio_base64);
      } else {
        setTimeout(() => { setVoiceState('idle'); setIsPlayingAudio(false); }, 3000);
      }
    } catch (err) {
      // Ignore abort errors — user voluntarily logged out
      if (err?.name === 'AbortError') return;
      console.error('processVoiceAudio error:', err);
      addMessage({
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage.code,
        text: `Error: ${err.message}`,
        isErrorFallback: true,
        errorReason: `Identity / Voice Pipeline: ${err.message}`,
        errorType: 'VoiceOrQuotaError',
        errorSubsystem: 'Identity & Audio Gateway',
      });
      setVoiceState('idle');
      setIsPlayingAudio(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigateTo,
        selectedLanguage,
        setSelectedLanguageCode,
        voiceState,
        setVoiceState,
        userRole,
        setUserRole,
        fallbackMode,
        setFallbackMode,
        messages,
        addMessage,
        resetConversation,
        activeCitation,
        setActiveCitation,
        activeArchitectureNode,
        setActiveArchitectureNode,
        activeKnowledgeDoc,
        setActiveKnowledgeDoc,
        isPlayingAudio,
        setIsPlayingAudio,
        playbackAudioText,
        setPlaybackAudioText,
        triggerVoiceQuerySimulation,
        processVoiceAudio,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        // Auth Exports
        user,
        authToken,
        isAuthModalOpen,
        quotaInfo,
        openAuthModal,
        closeAuthModal,
        loginUser,
        registerUserWithOtp,
        logoutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
