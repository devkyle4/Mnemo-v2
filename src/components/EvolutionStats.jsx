import { Volume2, Square } from 'lucide-react';
import { useState } from 'react';
import { generateSpeechAndPlay } from '../services/ttsService'



const EvolutionStats = ({
  evolutionHistory,
  generation,
  population,
  bestSolution,
  maxGenerations,
  setViewingGenome,
  viewingGenome,
  selectedSpeaker
}) => {
  const [currentAudio, setCurrentAudio] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(null);
  const [playingId, setPlayingId] = useState(null);


  const handlePlay = async (ind) => {
    const sentence = ind?.phenotype?.sentence;
    if (!sentence) return;

    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingId(null);
    }

    try {
      setLoadingAudio(ind.id);

      // Pass selected speaker to TTS
      const audio = await generateSpeechAndPlay(sentence, selectedSpeaker);

      setCurrentAudio(audio);
      setLoadingAudio(null);
      setPlayingId(ind.id);

      audio.onended = () => {
        setPlayingId(null);
        setCurrentAudio(null);
      };

      audio.play();

    } catch (error) {
      console.error('Speech generation failed:', error);
      setLoadingAudio(null);
      setPlayingId(null);
    }
  };

  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setPlayingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-purple-100">
      <h2 className="text-xl font-bold text-gray-800">Evolution Analytics</h2>


      {evolutionHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fitness Over Generations</h3>
          <div className="relative h-48 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <svg width="100%" height="100%" className="overflow-visible">
              {evolutionHistory.map((point, idx) => {
                if (idx === 0) return null;
                const prevPoint = evolutionHistory[idx - 1];
                const x1 = (prevPoint.gen / maxGenerations) * 100;
                const x2 = (point.gen / maxGenerations) * 100;

                // Calculate max fitness for scaling, default to 100 if 0 to avoid Infinity
                const maxHistoryFitness = Math.max(...evolutionHistory.map(p => p.fitness)) || 100;
                const scale = maxHistoryFitness * 1.1;

                
                const y1 = 100 - (prevPoint.fitness / scale) * 100;
                const y2 = 100 - (point.fitness / scale) * 100;

                const avgY1 = 100 - (prevPoint.avgFitness / scale) * 100;
                const avgY2 = 100 - (point.avgFitness / scale) * 100;

                return (
                  <g key={idx}>
                    {/* Best Fitness Line */}
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#9333ea"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Average Fitness Line */}
                    <line
                      x1={`${x1}%`}
                      y1={`${avgY1}%`}
                      x2={`${x2}%`}
                      y2={`${avgY2}%`}
                      stroke="#ec4899"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-2 right-2 text-xs space-y-1 bg-white/80 rounded p-2 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-purple-600"></div>
                <span>Best</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-pink-600 border-t border-dashed border-pink-600 h-px"></div>
                <span>Avg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">Current Generation</span>
          <span className="font-bold text-purple-600">{generation}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">Population Size</span>
          <span className="font-bold text-gray-900">{population.length}</span>
        </div>
        {bestSolution && (
          <>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm text-gray-700 font-medium">Best Fitness</span>
              <span className="font-bold text-green-600">{bestSolution.fitness.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-gray-700 font-medium">Avg Fitness</span>
              <span className="font-bold text-blue-600">
                {population.length > 0
                  ? (population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length).toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </>
        )}
        {evolutionHistory.length > 0 && (
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-sm text-gray-700 font-medium">Genome Diversity</span>
            <span className="font-bold text-purple-600">
              {evolutionHistory[evolutionHistory.length - 1]?.genomeDiversity || 0}
            </span>
          </div>
        )}
        {bestSolution && (
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-gray-700 font-medium">Avg Orthographic Similarity</span>
            <span className="font-bold text-green-600">
              {bestSolution.orthoScore?.toFixed(2) || 0}
            </span>
          </div>
        )}
        {bestSolution && (
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-gray-700 font-medium">Avg Readability Score</span>
            <span className="font-bold text-green-600">
              {bestSolution.readScore?.toFixed(2) || 0}
            </span>
          </div>
        )}
      </div>

      {/* Top Solutions */}
      {population.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Top {population.length} Candidates
          </h3>

          <div className="space-y-2">
            {population.slice(0, population.length).map((ind, idx) => {

              return (
                <div
                  key={ind.id}
                  className={`p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border transition cursor-pointer ${viewingGenome?.id === ind.id
                    ? 'border-purple-400 ring-2 ring-purple-200'
                    : 'border-purple-100 hover:shadow-md'
                    }`}
                  onClick={() =>
                    setViewingGenome(
                      viewingGenome?.id === ind.id ? null : ind
                    )
                  }
                >
                  <div className="flex items-center justify-between mb-1 gap-3">
                    <span className="text-xs font-bold text-purple-600">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-600">{ind.fitness.toFixed(2)}</span>

                      {loadingAudio === ind.id ? (
                        <div className="inline-flex items-center justify-center p-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        </div>
                      ) : playingId === ind.id ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center p-2 rounded-md bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700"
                          title="Stop"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStop();
                          }}
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center p-2 rounded-md bg-white/70 hover:bg-white border border-purple-200 text-purple-700"
                          title="Play"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(ind);
                          }}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {ind.phenotype && (
                    <div className="text-xs text-gray-700 italic line-clamp-2 mb-1">
                      "{ind.phenotype.sentence}"
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    <span className={ind.orthoScore > 50 ? "text-green-600 font-medium" : ""}>
                      Ortho: {ind.orthoScore?.toFixed(2) || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="text-green-600 font-medium">
                      Read: {ind.readScore?.toFixed(2) || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default EvolutionStats;