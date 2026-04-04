import { useState, useRef, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_KEY = 'paguito-chat-history';

const loadHistory = (): Message[] => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
};

const saveHistory = (msgs: Message[]) => {
  try {
    // Guardar solo los últimos 40 mensajes para no saturar sessionStorage
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs.slice(-40)));
  } catch {
    // sessionStorage lleno o no disponible — ignorar
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persistir historial en sessionStorage al cambiar mensajes
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Enfocar el input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Cancelar stream si se cierra el componente
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages, // enviar historial previo (sin el mensaje actual)
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al conectar con el asistente.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) throw new Error('Sin stream de respuesta.');

      // Leer el stream SSE chunk por chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setStreamingText(fullText);
            }
          } catch {
            // ignorar líneas mal formadas
          }
        }
      }

      // Al terminar el stream, mover el texto al historial real
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      setStreamingText('');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'Ocurrió un error. Intenta de nuevo.',
        },
      ]);
      setStreamingText('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setLoading(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* Panel del chat */}
      {open && (
        <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ width: '360px', height: '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Asistente Amigo Paguitos</p>
                <p className="text-xs text-blue-200 mt-0.5">¿En qué te ayudo hoy?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Limpiar conversación"
                  className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-blue-200 hover:text-white transition-colors text-xl leading-none"
                title="Cerrar chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">

            {/* Mensaje de bienvenida */}
            {messages.length === 0 && !streamingText && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-sm text-gray-700 max-w-[85%]">
                  ¡Hola! Soy el asistente de <strong>Amigo Paguitos Telcel</strong>. Puedo ayudarte con información sobre equipos, precios, crédito y más. ¿En qué te puedo ayudar?
                </div>
              </div>
            )}

            {/* Historial de mensajes */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-700 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Texto en streaming (respuesta llegando) */}
            {streamingText && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-white text-gray-700 px-3 py-2 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse rounded-sm" />
                </div>
              </div>
            )}

            {/* Indicador de "pensando..." antes de que llegue el primer chunk */}
            {loading && !streamingText && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-white text-gray-400 px-3 py-2 rounded-2xl rounded-tl-sm text-sm shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 bg-white border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 max-h-24 overflow-y-auto"
                style={{ lineHeight: '1.4' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                title="Enviar (Enter)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      )}

      {/* Burbuja flotante */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-primary-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        title="Abrir asistente virtual"
        aria-label="Abrir chat de soporte"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>
    </div>
  );
}
