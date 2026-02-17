// fitnessCalculator.js - All fitness evaluation logic with error handling

/**
 * Safely converts a value to a number, returning default if invalid
 */
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return num;
};

export const calculateGenomeFitness = (genome) => {
  // Validate genome input
  if (!genome || !Array.isArray(genome) || genome.length === 0) {
    console.warn('Invalid genome in calculateGenomeFitness');
    return 0;
  }

  let fitness = 0;

  // 1. Role diversity (avoid too many of same type) - 0-25 points
  const roleTypes = genome.map(g => g?.role || 'unknown').filter(r => r !== 'unknown');
  if (roleTypes.length === 0) {
    console.warn('No valid roles found in genome');
    return 0;
  }
  
  const uniqueRoles = new Set(roleTypes).size;
  fitness += (uniqueRoles / genome.length) * 25;

  // 2. Semantic flow potential - 0-25 points
  // Prefer patterns like: adjective → noun → verb → object
  const hasNounVerbPattern = roleTypes.some((role, idx) => {
    if (idx < roleTypes.length - 1) {
      const isNoun = role.includes('noun') || role.includes('person') || role.includes('animal');
      const nextIsVerb = roleTypes[idx + 1].includes('verb');
      return isNoun && nextIsVerb;
    }
    return false;
  });
  if (hasNounVerbPattern) fitness += 15;

  // Prefer descriptors before nouns
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

  // 3. Concreteness over abstraction - 0-20 points
  const concreteRoles = ['animal', 'noun_object', 'noun_food', 'person', 'vehicle', 'tool'];
  const concreteCount = roleTypes.filter(r => concreteRoles.some(cr => r.includes(cr))).length;
  fitness += (concreteCount / genome.length) * 20;

  // 4. Action presence (makes it memorable) - 0-15 points
  const hasAction = roleTypes.some(r => r.includes('verb'));
  if (hasAction) fitness += 15;

  // 5. Random variation for exploration - 0-15 points
  fitness += Math.random() * 15;

  // Ensure fitness is valid
  return safeNumber(fitness, 0);
};

export const calculateTotalFitness = (genome, phenotype) => {
  // Validate genome
  if (!genome || !Array.isArray(genome) || genome.length === 0) {
    console.warn('Invalid genome in calculateTotalFitness');
    return 0;
  }

  const genomeFitness = safeNumber(calculateGenomeFitness(genome), 0);
  
  // If no phenotype, return just genome fitness
  if (!phenotype || typeof phenotype !== 'object') {
    return genomeFitness;
  }

  // Extract phenotype scores with fallbacks for both naming conventions
  const memorability = safeNumber(
    phenotype.memorability_score || phenotype.memorability,
    0
  );
  
  const coherence = safeNumber(
    phenotype.coherence_score || phenotype.coherence,
    0
  );
  
  // Calculate phenotype fitness component
  const phenotypeFitness = (memorability * 0.4) + (coherence * 0.6);
  const validPhenotypeFitness = safeNumber(phenotypeFitness, 0);
  
  // Combine genome and phenotype fitness
  const totalFitness = genomeFitness + validPhenotypeFitness;
  
  // Final validation and clamping to reasonable range
  const finalFitness = safeNumber(totalFitness, 0);
  
  // Optional: Clamp to max reasonable value (e.g., 200)
  return Math.min(finalFitness, 200);
};