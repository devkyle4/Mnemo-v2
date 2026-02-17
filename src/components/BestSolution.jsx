import { Sparkles, Eye } from 'lucide-react';

const BestSolution = ({
  bestSolution,
  parsedTerms,
  generation,
  maxGenerations,
  viewingGenome,
  setViewingGenome,
}) => {
  
  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-purple-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Best Mnemonic
        </h2>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Generation: {generation} / {maxGenerations}</span>
          <span>{((generation / maxGenerations) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all"
            style={{ width: `${(generation / maxGenerations) * 100}%` }}
          />
        </div>
      </div>

      {bestSolution && bestSolution.phenotype ? (
        <div>
          <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-xl p-6 mb-4 border-2 border-purple-200 shadow-inner">
            <div className="text-sm text-gray-600 mb-3 font-medium">Generated Mnemonic:</div>

            <div className="space-y-3 mb-4">
              {bestSolution.phenotype.words && bestSolution.phenotype.words.map((word, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl font-bold text-purple-600 block w-8">
                      {parsedTerms[idx]?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-800">
                      {typeof word === 'object' ? word.word : word}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {parsedTerms[idx]} • <span className="text-purple-400 italic">{bestSolution.genome[idx]?.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-purple-200">
              <div className="text-lg font-medium text-purple-900 italic leading-relaxed">
                "{bestSolution.phenotype.sentence}"
              </div>
            </div>
          </div>

          <button
            onClick={() => setViewingGenome(viewingGenome ? null : bestSolution)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition text-sm font-medium text-purple-700"
          >
            <Eye className="w-4 h-4" />
            {viewingGenome ? 'Hide' : 'View'} Genome Structure
          </button>

          {viewingGenome && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 font-mono text-[10px] overflow-x-auto">
              <pre className="text-gray-600">
                {JSON.stringify(bestSolution.genome, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Awaiting Evolution...</p>
          <p className="text-xs mt-2 px-10">The Genetic Algorithm will optimize semantic blueprints while Gemini 2.5 instantiates the language.</p>
        </div>
      )}
    </div>
  );
};

export default BestSolution;
