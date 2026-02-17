import { levenshteinDistance } from './levenshteinDist';

export const calculateOrthographicSimilarity = (keyword, targetWord) => {
  // Safety checks
  if (!keyword || !targetWord) return 0;

  keyword = String(keyword);
  targetWord = String(targetWord);

  const maxLen = Math.max(keyword.length, targetWord.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(keyword, targetWord);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.max(0, similarity);
};

export const calculateAverageOrthographicSimilarity = (keywords, targetWords) => {

  if (!keywords || !targetWords || keywords.length !== targetWords.length) {
    return 0;
  }

  // Filter out invalid entries
  const validPairs = keywords
    .map((keyword, idx) => ({ keyword, target: targetWords[idx] }))
    .filter(pair => pair.keyword && pair.target);

  if (validPairs.length === 0) return 0;

  const similarities = validPairs.map(pair =>
    calculateOrthographicSimilarity(pair.keyword, pair.target)
  );

  const average = similarities.reduce((sum, score) => sum + score, 0) / similarities.length;
  return average;
};


export const calculateReadability = (keyword, targetWord) => {
  let ratio = 0

  if (!keyword || !targetWord) return 0;
  const keywordLen = keyword.length;
  const targetLen = targetWord.length;

  ratio = (1.5 - (keywordLen / targetLen))

  return ratio
}

export const calculateAverageReadability = (keywords, targetWords) => {
  if (!keywords || !targetWords || keywords.length !== targetWords.length) {
    return 0;
  }

  const scores = keywords.map((keyword, idx) =>
    calculateReadability(keyword, targetWords[idx])
  );

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const calculateGenomeFitness = (genome) => {
  let fitness = 0;

  // 1. Role diversity (0-25 points)
  const roleTypes = genome.map(g => g.role);
  const uniqueRoles = new Set(roleTypes).size;
  fitness += (uniqueRoles / genome.length) * 25;

  // 2. Semantic flow potential (0-25 points)
  const hasNounVerbPattern = roleTypes.some((role, idx) => {
    if (idx < roleTypes.length - 1) {
      const isNoun = role.includes('noun') || role.includes('person') || role.includes('animal');
      const nextIsVerb = roleTypes[idx + 1].includes('verb');
      return isNoun && nextIsVerb;
    }
    return false;
  });
  if (hasNounVerbPattern) fitness += 15;

  const hasAdjectiveNounPattern = roleTypes.some((role, idx) => {
    if (idx < roleTypes.length - 1) {
      const isAdjective = role.includes('adjective');
      const nextIsNoun = roleTypes[idx + 1].includes('noun') ||
        roleTypes[idx + 1].includes('animal') ||
        roleTypes[idx + 1].includes('person');
      return isAdjective && nextIsNoun;
    }
    return false;
  });
  if (hasAdjectiveNounPattern) fitness += 10;

  // 3. Concreteness (0-20 points)
  const concreteRoles = ['animal', 'noun_object', 'noun_food', 'person', 'vehicle', 'tool'];
  const concreteCount = roleTypes.filter(r => concreteRoles.some(cr => r.includes(cr))).length;
  fitness += (concreteCount / genome.length) * 20;

  // 4. Action presence (0-15 points)
  const hasAction = roleTypes.some(r => r.includes('verb'));
  if (hasAction) fitness += 15;

  // 5. Random variation (0-15 points)
  fitness += Math.random() * 15;

  return fitness;
};

export const calculateTotalFitness = (genome, phenotype) => {
  const genomeFitness = calculateGenomeFitness(genome);

  if (!phenotype || !phenotype.words || !Array.isArray(phenotype.words)) {
    return {
      totalFitness: genomeFitness,
      genomeFitness: genomeFitness,
      readabilityScore: 0,
      orthoScore: 0
    };
  }

  // Extract target words from genome
  const targetWords = genome.map(slot => slot.originalTerm || '');
  const keywords = phenotype.words.filter(w => w);


  // Calculate orthographic similarity
  const orthoScore = calculateAverageOrthographicSimilarity(keywords, targetWords);
  const readScore = calculateAverageReadability(keywords, targetWords);

  // Combined fitness: Genome (0-100) + Orthographic (0-100)
  const totalFitness = genomeFitness + orthoScore + readScore;

  return {
    totalFitness,
    genomeFitness,
    orthoScore,
    readScore
  };
};
