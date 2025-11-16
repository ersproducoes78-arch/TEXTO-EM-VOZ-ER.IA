import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import { playAudio, createWavBlobFromBase64 } from './utils/audioUtils';
import { AVAILABLE_VOICES, LANGUAGES, GENDERS } from './constants';
import { VoiceOption, QueueItem } from './types';
import { SpeakerIcon, PlayIcon, LoadingSpinner, DownloadIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './components/icons';

// @ts-ignore - JSZip is loaded from CDN
const JSZip = window.JSZip;

const App: React.FC = () => {
  const [currentText, setCurrentText] = useState<string>('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0]);
  const [selectedAccent, setSelectedAccent] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>(GENDERS[0]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  
  const availableAccents = useMemo(() => 
    [...new Set(AVAILABLE_VOICES.filter(v => v.language === selectedLanguage).map(v => v.accent))],
    [selectedLanguage]
  );

  const filteredVoices = useMemo(() => 
    AVAILABLE_VOICES.filter(v => 
      v.language === selectedLanguage && 
      v.accent === selectedAccent &&
      (selectedGender === 'Todos' || v.gender === selectedGender)
    ),
    [selectedLanguage, selectedAccent, selectedGender]
  );

  useEffect(() => {
    if (availableAccents.length > 0 && !availableAccents.includes(selectedAccent)) {
      setSelectedAccent(availableAccents[0]);
    } else if (availableAccents.length === 0) {
      setSelectedAccent('');
    }
  }, [selectedLanguage, availableAccents, selectedAccent]);

  useEffect(() => {
    if (filteredVoices.length > 0 && !filteredVoices.some(v => v.id === selectedVoice)) {
      setSelectedVoice(filteredVoices[0].id);
    } else if (filteredVoices.length === 0) {
      setSelectedVoice('');
    }
  }, [filteredVoices, selectedVoice]);

  const handleAddToQueue = () => {
    if (!currentText.trim()) return;
    const newItem: QueueItem = {
      id: Date.now().toString(),
      text: currentText.trim(),
      status: 'queued',
    };
    setQueue(prev => [...prev, newItem]);
    setCurrentText('');
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };
  
  const handleProcessQueue = useCallback(async () => {
    if (!selectedVoice) {
      alert('Por favor, selecione uma voz válida antes de iniciar.');
      return;
    }
    
    setIsProcessingQueue(true);
    const newQueue = [...queue];

    for (let i = 0; i < newQueue.length; i++) {
      if (newQueue[i].status !== 'queued') continue;

      try {
        newQueue[i] = { ...newQueue[i], status: 'generating' };
        setQueue([...newQueue]);

        const audioB64 = await generateSpeech(newQueue[i].text, selectedVoice);
        
        newQueue[i] = { ...newQueue[i], status: 'done', generatedAudio: audioB64 };
        setQueue([...newQueue]);
      } catch (err: any) {
        newQueue[i] = { ...newQueue[i], status: 'error', error: err.message || 'Erro desconhecido' };
        setQueue([...newQueue]);
      }
    }

    setIsProcessingQueue(false);
  }, [queue, selectedVoice]);

  const handlePlayAudio = useCallback(async (audioB64: string) => {
    try {
      await playAudio(audioB64);
    } catch (err) {
      console.error("Error playing audio:", err);
      alert("Não foi possível reproduzir o áudio.");
    }
  }, []);

  const handleDownloadAudio = useCallback((audioB64: string, index: number) => {
    try {
      const blob = createWavBlobFromBase64(audioB64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio_${index + 1}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error creating download file:", err);
      alert("Não foi possível criar o arquivo para download.");
    }
  }, []);

  const handleDownloadAllAsZip = useCallback(async () => {
    const zip = new JSZip();
    const successfulItems = queue.filter(item => item.status === 'done' && item.generatedAudio);

    successfulItems.forEach((item, index) => {
      const blob = createWavBlobFromBase64(item.generatedAudio!);
      zip.file(`audio_${index + 1}.wav`, blob);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gerador-de-voz-eria-audios.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error creating zip file:", err);
        alert("Não foi possível criar o arquivo .zip.");
    }
  }, [queue]);

  const canProcessQueue = useMemo(() => queue.some(item => item.status === 'queued') && !isProcessingQueue, [queue, isProcessingQueue]);
  const canDownloadZip = useMemo(() => queue.some(item => item.status === 'done'), [queue]);

  const getStatusIcon = (status: QueueItem['status']) => {
    switch(status) {
      case 'generating': return <LoadingSpinner className="w-5 h-5 text-cyan-400" />;
      case 'done': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'error': return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'queued':
      default:
        return <span className="text-xs font-mono text-gray-500">NA FILA</span>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-cyan-400 selection:text-black">
      <div className="w-full max-w-3xl mx-auto">
        
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <SpeakerIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              Gerador de Voz ER.IA
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Adicione textos à fila, escolha uma voz e gere múltiplos áudios de uma vez.
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Voice selection controls */}
             <div className="space-y-2">
                <label htmlFor="language-select" className="font-medium text-gray-300">Idioma</label>
                <div className="relative"><select id="language-select" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full appearance-none p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 pr-10">{LANGUAGES.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
            </div>
             <div className="space-y-2">
                <label htmlFor="accent-select" className="font-medium text-gray-300">Sotaque</label>
                <div className="relative"><select id="accent-select" value={selectedAccent} onChange={(e) => setSelectedAccent(e.target.value)} disabled={availableAccents.length === 0} className="w-full appearance-none p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 pr-10 disabled:opacity-50">{availableAccents.map((accent) => (<option key={accent} value={accent}>{accent}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
            </div>
            <div className="space-y-2">
              <label htmlFor="gender-select" className="font-medium text-gray-300">Gênero</label>
              <div className="relative"><select id="gender-select" value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="w-full appearance-none p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 pr-10">{GENDERS.map((gender) => (<option key={gender} value={gender}>{gender}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
            </div>
            <div className="space-y-2">
                <label htmlFor="voice-select" className="font-medium text-gray-300">Voz</label>
                <div className="relative"><select id="voice-select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} disabled={filteredVoices.length === 0} className="w-full appearance-none p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 pr-10 disabled:opacity-50">{filteredVoices.map((voice: VoiceOption) => (<option key={voice.id} value={voice.id}>{voice.name} ({voice.gender})</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <label htmlFor="text-input" className="font-medium text-gray-300">Texto para Adicionar à Fila</label>
            <div className="flex gap-2">
              <textarea
                id="text-input"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Digite o texto aqui..."
                className="flex-grow p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none h-24"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddToQueue(); } }}
              />
              <button onClick={handleAddToQueue} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 self-stretch">Adicionar</button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-300">Fila de Geração ({queue.length})</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {queue.length > 0 ? queue.map((item, index) => (
                <div key={item.id} className="bg-gray-900/70 p-3 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 truncate">{item.text}</p>
                    {item.status === 'error' && <p className="text-red-400 text-sm mt-1">{item.error}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                     {getStatusIcon(item.status)}
                    {item.status === 'done' && item.generatedAudio && (
                      <>
                        <button onClick={() => handlePlayAudio(item.generatedAudio!)} title="Ouvir" className="text-gray-400 hover:text-white transition-colors"><PlayIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDownloadAudio(item.generatedAudio!, index)} title="Baixar" className="text-gray-400 hover:text-white transition-colors"><DownloadIcon className="w-5 h-5"/></button>
                      </>
                    )}
                    <button onClick={() => handleRemoveFromQueue(item.id)} title="Remover" className="text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </div>
              )) : <p className="text-gray-500 text-center py-4">A fila está vazia.</p>}
            </div>
          </div>
          
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleProcessQueue}
              disabled={!canProcessQueue || !selectedVoice}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isProcessingQueue ? <><LoadingSpinner className="w-5 h-5"/><span>Processando Fila...</span></> : 'Gerar Todos'}
            </button>
             {canDownloadZip && (
                <button
                onClick={handleDownloadAllAsZip}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                <DownloadIcon className="w-5 h-5"/>
                Baixar Todos (.zip)
                </button>
            )}
          </div>

        </main>

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Criado com React, Tailwind CSS, e Gemini API.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
