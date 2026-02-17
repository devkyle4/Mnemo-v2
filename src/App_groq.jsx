import React, { useState, useEffect } from 'react';
import './index.css'
import { Play, Pause, RotateCcw, Settings, Info, Download, Sparkles, Dna } from 'lucide-react';
// Import utilities and services
import { DEFAULT_INPUT, DEFAULT_TOPIC, DEFAULT_SETTINGS, SEMANTIC_ROLES } from './constants/semanticRoles';
import { parseTerms, getFirstLetters } from './utils/textParser';
import { initializePopulation, evolveGeneration, calculateDiversity, calculateAverageFitness } from './utils/gaEngine';
import { exportData } from './utils/exportUtils';

// Import components
import BestSolution from './components/BestSolution';
import EvolutionStats from './components/EvolutionStats';
import SettingsPanel from './components/SettingsPanel';

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

  // Parse input terms
  useEffect(() => {
    const terms = parseTerms(inputText);
    setParsedTerms(terms);
  }, [inputText]);

  // Evolution loop
  useEffect(() => {
    if (!isRunning || generation >= settings.maxGenerations || parsedTerms.length === 0) {
      if (generation >= settings.maxGenerations) setIsRunning(false);
      return;
    }

    const evolve = async () => {
      setLlmGenerating(true);
      const newPop = await evolveGeneration(population, settings, topic);
      setLlmGenerating(false);

      setPopulation(newPop);
      setGeneration(g => g + 1);
      setBestSolution(newPop[0]);

      setEvolutionHistory(prev => [...prev, {
        gen: generation,
        fitness: newPop[0].fitness,
        avgFitness: calculateAverageFitness(newPop),
        genomeDiversity: calculateDiversity(newPop)
      }]);
    };

    evolve();
  }, [isRunning, generation]);

  const startEvolution = async () => {
    if (parsedTerms.length === 0) {
      alert('Please enter terms to create a mnemonic for');
      return;
    }

    if (generation === 0) {
      setLlmGenerating(true);
      const firstLetters = getFirstLetters(parsedTerms);
      const initialPop = await initializePopulation(firstLetters, topic, settings.populationSize);
      setLlmGenerating(false);

      setPopulation(initialPop);
      setBestSolution(initialPop[0]);
    }
    setIsRunning(true);
  };

  const resetEvolution = () => {
    setIsRunning(false);
    setGeneration(0);
    setPopulation([]);
    setBestSolution(null);
    setEvolutionHistory([]);
    setViewingGenome(null);
  };

  const handleExportData = () => {
    exportData(parsedTerms, topic, settings, generation, bestSolution, evolutionHistory);
  };

  return (

    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Dna className="w-8 h-8 text-purple-600" />
                  GA-LLM Hybrid Mnemonic Generator
                </h1>
                <p className="text-gray-600 mt-1">Genetic Algorithm evolves structure • LLM instantiates language</p>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 hover:bg-purple-50 rounded-lg transition"
              >
                <Settings className="w-6 h-6 text-purple-600" />
              </button>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms to Memorize (one per line)
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  disabled={isRunning}
                  placeholder="Enter any list of terms..."
                />
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                  <span className="font-medium">{parsedTerms.length} terms</span>
                  <span className="text-purple-600 font-mono">{getFirstLetters(parsedTerms).join('')}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Context
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isRunning}
                  placeholder="e.g., astronomy, history, biology"
                />

                <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">How It Works</h3>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">1.</span>
                      <span>GA evolves <strong>abstract roles</strong> (genome)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">2.</span>
                      <span>LLM generates <strong>actual words</strong> (phenotype)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">3.</span>
                      <span>Fitness evaluates both structure & output</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                isRunning={isRunning}
              />
            )}

            {/* Control Buttons */}
            <div className="flex gap-3 flex-wrap items-center">
              <button
                onClick={isRunning ? () => setIsRunning(false) : startEvolution}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-md disabled:opacity-50"
                disabled={parsedTerms.length === 0 || llmGenerating}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isRunning ? 'Pause Evolution' : 'Start Evolution'}
              </button>
              <button
                onClick={resetEvolution}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleExportData}
                disabled={!bestSolution}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
              {llmGenerating && (
                <div className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">LLM Instantiating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Display Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BestSolution
              bestSolution={bestSolution}
              parsedTerms={parsedTerms}
              generation={generation}
              maxGenerations={settings.maxGenerations}
              viewingGenome={viewingGenome}
              setViewingGenome={setViewingGenome}
            />

            <EvolutionStats
              evolutionHistory={evolutionHistory}
              generation={generation}
              population={population}
              bestSolution={bestSolution}
              maxGenerations={settings.maxGenerations}
              setViewingGenome={setViewingGenome}
              viewingGenome={viewingGenome}
            />
          </div>

          {/* Research Information Panel */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Hybrid GA-LLM Architecture for Research
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🧬 Genotype Layer (GA)</h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• Evolves abstract semantic roles</li>
                  <li>• Crossover operates on structure</li>
                  <li>• Mutation changes role types</li>
                  <li>• Selection based on genome quality</li>
                  <li>• Example: [animal, verb, adjective]</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🤖 Phenotype Layer (LLM)</h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• Instantiates roles into words</li>
                  <li>• Ensures grammatical coherence</li>
                  <li>• Maintains letter constraints</li>
                  <li>• Evaluates memorability</li>
                  <li>• Example: "Owls vaulted above"</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Why This is a True GA</h4>
                <p className="text-xs text-gray-700">
                  The genetic algorithm operates entirely on abstract semantic structures (genotype).
                  The LLM is simply a <strong>phenotype expression function</strong> - it doesn't evolve,
                  it only translates. All evolutionary operations (selection, crossover, mutation) happen
                  at the structural level, making this a legitimate hybrid optimization approach.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Research Metrics</h4>
                <p className="text-xs text-gray-700">
                  Export data includes: genome sequences, phenotype evaluations, fitness trajectories,
                  diversity metrics, convergence rates, and LLM evaluation scores. All data is timestamped
                  and structured for statistical analysis, publication, and reproducibility.
                </p>
              </div>
            </div>
          </div>

          {/* Semantic Role Reference */}
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Semantic Roles (Genome Vocabulary)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {SEMANTIC_ROLES.map(role => (
                <div key={role} className="px-3 py-2 bg-purple-50 rounded border border-purple-200 text-gray-700 font-mono">
                  {role}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              The GA randomly assigns and evolves these roles. The LLM receives a genome like
              <code className="bg-gray-100 px-1 rounded mx-1">[animal, action_verb, adjective_color]</code>
              and generates actual words that fit each role while starting with the required letters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcrosticMnemonicGA;