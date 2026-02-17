export const exportData = (parsedTerms, topic, settings, generation, bestSolution, evolutionHistory) => {
  const data = {
    terms: parsedTerms,
    topic,
    settings,
    generation,
    bestGenome: bestSolution?.genome,
    bestPhenotype: bestSolution?.phenotype,
    evolutionHistory,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ga-llm-mnemonic-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

