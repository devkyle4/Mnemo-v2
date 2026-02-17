import { SEMANTIC_ROLES } from '../constants/semanticRoles';

export const generateGenome = (firstLetters, originalTerms) => {
  return firstLetters.map((letter, idx) => ({
    letter: letter,
    role: SEMANTIC_ROLES[Math.floor(Math.random() * SEMANTIC_ROLES.length)],
    originalTerm: originalTerms[idx]
  }));
};

export const crossover = (parent1Genome, parent2Genome) => {
  const point = Math.floor(Math.random() * parent1Genome.length);
  return [
    ...parent1Genome.slice(0, point),
    ...parent2Genome.slice(point)
  ];
};

export const mutate = (genome, mutationRate) => {
  const mutated = [...genome];
  
  for (let i = 0; i < genome.length; i++) {
    if (Math.random() < mutationRate) {
      const currentRole = mutated[i].role;
      
      let newRole;
      if (Math.random() < 0.6) {
        // Related mutation (e.g., animal → mythical_creature)
        const category = currentRole.split('_')[0];
        const sameCategory = SEMANTIC_ROLES.filter(r => r.startsWith(category));
        newRole = sameCategory.length > 1 
          ? sameCategory[Math.floor(Math.random() * sameCategory.length)]
          : SEMANTIC_ROLES[Math.floor(Math.random() * SEMANTIC_ROLES.length)];
      } else {
        // Random mutation
        newRole = SEMANTIC_ROLES[Math.floor(Math.random() * SEMANTIC_ROLES.length)];
      }
      
      mutated[i] = { ...mutated[i], role: newRole };
    }
  }
  
  return mutated;
};