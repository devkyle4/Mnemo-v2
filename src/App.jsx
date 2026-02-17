import { useState, useEffect } from 'react';
import './index.css';
import { Play, Pause, RotateCcw, Settings, Save, Download, Sparkles, Dna, User } from 'lucide-react';
// Import constants and utils
import { DEFAULT_INPUT, DEFAULT_TOPIC, DEFAULT_SETTINGS, SEMANTIC_ROLES } from './constants/semanticRoles';
import { parseTerms, getFirstLetters } from './utils/textParser';
import { initializePopulation, evolveGeneration } from './utils/gaEngine';
import { SaveData, downloadSaveDataFile } from './utils/saveUtil';
import { useAlert } from './hooks/useAlert';
import { getAvailableSpeakers } from './services/ttsService';
//components
import BestSolution from './components/BestSolution';
import EvolutionStats from './components/EvolutionStats';
import SettingsPanel from './components/SettingsPanel';
import GenerateImage from "./components/GenerateImage";


const AcrosticMnemonicGA = () => {
    const [inputText, setInputText] = useState(DEFAULT_INPUT);
    const [parsedTerms, setParsedTerms] = useState([]);
    const [topic, setTopic] = useState(DEFAULT_TOPIC);
    const [population, setPopulation] = useState([]);
    const [generation, setGeneration] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [bestSolution, setBestSolution] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [evolutionHistory, setEvolutionHistory] = useState([]);
    const [llmGenerating, setLlmGenerating] = useState(false);
    const [viewingGenome, setViewingGenome] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSpeaker, setSelectedSpeaker] = useState('Ana Florence');
    const [availableSpeakers, setAvailableSpeakers] = useState([]);
    const [showSpeakerMenu, setShowSpeakerMenu] = useState(false);

    // Constants for parsing
    const currentFirstLetters = getFirstLetters(parsedTerms);

    // calling hook
    const { alerts, removeAlert, success, error, warning, info } = useAlert();

    // Fetch available speakers on mount
    useEffect(() => {
        const fetchSpeakers = async () => {
            const speakers = await getAvailableSpeakers();
            setAvailableSpeakers(speakers);
            if (speakers.length > 0 && !speakers.includes(selectedSpeaker)) {
                setSelectedSpeaker(speakers[0]);
            }
        };
        fetchSpeakers();
    }, []);

    // 1. Parse input terms whenever text changes
    useEffect(() => {
        const terms = parseTerms(inputText);
        setParsedTerms(terms);
    }, [inputText]);

    // 2. Evolution loop
    useEffect(() => {
        if (!isRunning || generation >= settings.maxGenerations || parsedTerms.length === 0) {
            if (generation >= settings.maxGenerations) setIsRunning(false);
            return;
        }

        // Safety check: Don't evolve if population is empty
        if (!population || population.length === 0) {
            console.error("Cannot evolve with empty population");
            setIsRunning(false);
            return;
        }

        const evolve = async () => {
            setLlmGenerating(true);

            try {
                // Add a small breather for the API (2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));

                const newPop = await evolveGeneration(population, settings, topic);

                // Safety check: Ensure newPop is valid
                if (!newPop || newPop.length === 0) {
                    console.error("Evolution returned empty population");
                    setIsRunning(false);
                    return;
                }

                // Calculate Statistics locally
                const avgFitness = newPop.reduce((acc, ind) => acc + ind.fitness, 0) / newPop.length;

                // Basic diversity: count unique fitness scores as a proxy
                const uniqueFitnesses = new Set(newPop.map(ind => ind.fitness.toFixed(2))).size;

                setPopulation(newPop);
                setBestSolution(newPop[0]);
                setEvolutionHistory(prev => [...prev, {
                    gen: generation + 1,
                    fitness: newPop[0].fitness,
                    avgFitness: avgFitness,
                    genomeDiversity: uniqueFitnesses
                }]);

                setGeneration(g => g + 1);
            } catch (err) {
                console.error("Evolution Step Failed:", err);
                setIsRunning(false);
            } finally {
                setLlmGenerating(false);
            }
        };

        evolve();
    }, [isRunning, generation, population, settings, topic]);

    const startEvolution = async () => {
        if (parsedTerms.length === 0) {
            alert('Please enter terms to create a mnemonic for');
            return;
        }

        if (generation === 0) {
            setLlmGenerating(true);
            try {
                const firstLetters = getFirstLetters(parsedTerms);
                console.log('Initializing with:', { firstLetters, parsedTerms, topic, populationSize: settings.populationSize });

                const initialPop = await initializePopulation(firstLetters, parsedTerms, topic, settings.populationSize);

                console.log('Initial population created:', initialPop);

                if (!initialPop || initialPop.length === 0) {
                    throw new Error('Failed to create initial population');
                }

                // Calculate initial statistics
                const initialAvgFitness = initialPop.reduce((acc, ind) => acc + ind.fitness, 0) / initialPop.length;
                const initialUniqueFitnesses = new Set(initialPop.map(ind => ind.fitness.toFixed(2))).size;

                setPopulation(initialPop);
                setBestSolution(initialPop[0]);
                
                // Record generation 0 in history
                setEvolutionHistory([{
                    gen: 0,
                    fitness: initialPop[0].fitness,
                    avgFitness: initialAvgFitness,
                    genomeDiversity: initialUniqueFitnesses
                }]);
                
                setIsRunning(true);
            } catch (err) {
                console.error("Initialization error:", err);
                alert("Failed to initialize: " + err.message + ". Check console for details.");
            } finally {
                setLlmGenerating(false);
            }
        } else {
            setIsRunning(true);
        }
    };

    const resetEvolution = () => {
        setIsRunning(false);
        setGeneration(0);
        setPopulation([]);
        setBestSolution(null);
        setEvolutionHistory([]);
        setViewingGenome(null);
    };

    const handleSaveData = async () => {
        setIsSaving(true)

        try {
            const result = await SaveData(
                generation,
                population,
                bestSolution,
                settings,
                topic,
                parsedTerms,
            )
            if (result.success) {
                success(
                    'Data Saved Successfully!',
                    `Your evolution run has been saved to row ${result.row} in the Excel file.`
                );
            } else {
                error(
                    'Save Failed',
                    result.error || 'Unable to save data. Please try again.'
                );
            }
        } catch (error) {
            error(
                'Connection Error',
                `Failed to connect to backend server.${error.message}`)
        } finally {
            setIsSaving(false);
        }
    }

    const handleDownloadFile = async () => {
        try {
            info(
                'Downloading...',
                'Preparing your Excel file for download.',
                { duration: 2000 }
            );

            const result = await downloadSaveDataFile();

            if (result.success) {
                success(
                    'Download Complete!',
                    'Your evolution data has been downloaded successfully.'
                );
            } else {
                error(
                    'Download Failed',
                    result.error || 'Unable to download file.'
                );
            }
        } catch (error) { }
    }

    return (
        <div className="min-w-screen w-full bg-gray-100 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border border-purple-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                                    <Dna className="w-8 h-8 text-purple-600" />
                                    Mnemonic Evolver <span className="text-sm font-light text-gray-400">v2.0 Mistral</span>
                                </h1>
                            </div>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-3 rounded-lg transition ${showSettings ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                            >
                                <Settings className="w-6 h-6 text-purple-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Target Terms (one per line)</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                    disabled={isRunning}
                                />
                                <div className="mt-2 text-xs text-gray-500 flex gap-2">
                                    <span className="bg-purple-100 px-2 py-1 rounded text-purple-700 font-bold">{currentFirstLetters.join('')}</span>
                                    <span className="py-1">{parsedTerms.length} Target Words Detected</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Topic Context</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        disabled={isRunning}
                                    />
                                </div>

                                {/* Speaker Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">TTS Voice</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSpeakerMenu(!showSpeakerMenu)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-purple-400 focus:ring-2 focus:ring-purple-500 transition"
                                            disabled={isRunning}
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm truncate">{selectedSpeaker}</span>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {showSpeakerMenu && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setShowSpeakerMenu(false)}
                                                />
                                                
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                                                    <div className="px-3 py-2 bg-purple-50 border-b border-purple-100">
                                                        <p className="text-xs font-semibold text-purple-700">Select Voice</p>
                                                    </div>
                                                    {availableSpeakers.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500">Loading speakers...</div>
                                                    ) : (
                                                        availableSpeakers.map((speaker) => (
                                                            <button
                                                                key={speaker}
                                                                onClick={() => {
                                                                    setSelectedSpeaker(speaker);
                                                                    setShowSpeakerMenu(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition ${
                                                                    selectedSpeaker === speaker 
                                                                        ? 'bg-purple-100 text-purple-700 font-medium' 
                                                                        : 'text-gray-700'
                                                                }`}
                                                            >
                                                                {speaker}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {showSettings && (
                            <SettingsPanel settings={settings} setSettings={setSettings} isRunning={isRunning} />
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={isRunning ? () => setIsRunning(false) : startEvolution}
                                disabled={llmGenerating}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-bold"
                            >
                                {isRunning ? <Pause /> : <Play />} {isRunning ? 'Pause' : 'Evolve'}
                            </button>
                            <button onClick={resetEvolution} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSaveData}
                                className={`flex items-center gap-2 px-8 py-3 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg transition font-bold 
                                    ${(!bestSolution || isSaving || isRunning) ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600'
                                    }`}>
                                <Save className='w-5 h-5' />
                                {isSaving ? "Saving..." : "Save Run"}
                            </button>
                            <button onClick={handleDownloadFile}
                                className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:bg-green-700 transition font-weight:100"
                            >
                                <Download className='w-5 h-5' />
                                Download Results
                            </button>
                            {llmGenerating && (
                                <div className="flex items-center gap-2 text-purple-600 animate-pulse ml-4">
                                    <Sparkles /> <span className="text-sm font-medium">Mistral Thinking...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Card 1: Best Mnemonic */}
                        <BestSolution
                            bestSolution={bestSolution}
                            parsedTerms={parsedTerms}
                            generation={generation}
                            maxGenerations={settings.maxGenerations}
                            viewingGenome={viewingGenome}
                            setViewingGenome={setViewingGenome}
                            isRunning={isRunning}
                            selectedSpeaker={selectedSpeaker}
                        />

                        {/* Card 2: Evolution Analytics */}
                        <EvolutionStats
                            evolutionHistory={evolutionHistory}
                            generation={generation}
                            population={population}
                            bestSolution={bestSolution}
                            maxGenerations={settings.maxGenerations}
                            setViewingGenome={setViewingGenome}
                            viewingGenome={viewingGenome}
                            selectedSpeaker={selectedSpeaker}
                        />

                        {/* Card 3: Generate Image */}
                        <div className="h-full ">
                            <GenerateImage
                                sentence={viewingGenome?.phenotype?.sentence || bestSolution?.phenotype?.sentence}
                                isRunning={isRunning}
                                generation={generation}
                                maxGenerations={settings.maxGenerations}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default AcrosticMnemonicGA;