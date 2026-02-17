// gaEngine.jsx - Evolution logic using Gemini 1.5 Flash
import { generateGenome, crossover, mutate } from './genomeUtils';
import { instantiateBatch } from '../services/llmService'; // Ensure this matches your filename
import { calculateTotalFitness } from './fitnessCalculator';

// The "Anchor" words used for Orthographic Similarity (Keyword strategy)
const TARGET_PLANETS = [
  "Mercury", "Venus", "Earth", "Mars", 
  "Jupiter", "Saturn", "Uranus", "Neptune"
];

/**
 * Tournament Selection: Picks a parent by choosing 3 random individuals 
 * and taking the best one.
 */
const selectParent = (population) => {
  const tournamentSize = 3;
  let best = null;
  for (let i = 0; i < tournamentSize; i++) {
    const ind = population[Math.floor(Math.random() * population.length)];
    if (!best || ind.fitness > best.fitness) best = ind;
  }
  return best;
};

/**
 * Initial Setup: Creates the first random generation
 */
export const initializePopulation = async (firstLetters, parsedTerms, topic, populationSize) => {
  console.log('initializePopulation called with:', { firstLetters, parsedTerms, topic, populationSize });

  try {
    const genomes = Array.from({ length: populationSize }, () =>
      generateGenome(firstLetters, parsedTerms)
    );

    const phenotypes = await instantiateBatch(genomes, topic, parsedTerms);
    console.log('Phenotypes received:', phenotypes);

    // Check for errors in phenotypes
    const errorPhenotypes = phenotypes.filter(p => p.sentence.startsWith("Error:"));
    if (errorPhenotypes.length > 0) {
      console.error("Phenotypes with errors:", errorPhenotypes);
      throw new Error(`${errorPhenotypes.length} phenotypes failed to generate`);
    }

    const population = genomes.map((genome, i) => {
      const rawPhenotype = phenotypes[i] || {
        sentence: "Initializing structure...",
        words: genome.map(g => g.letter + "word")
      };

      const fitnessData = calculateTotalFitness(genome, rawPhenotype);
      console.log(`Fitness data for genome ${i}:`, fitnessData);

      return {
        genome,
        phenotype: rawPhenotype,
        fitness: fitnessData.totalFitness,
        orthoScore: fitnessData.orthoScore,
        id: Math.random()
      };
    }).sort((a, b) => b.fitness - a.fitness);

    console.log('Population created and sorted:', population.length);
    return population;

  } catch (error) {
    console.error('Error in initializePopulation:', error);
    throw error;
  }
};


export const evolveGeneration = async (population, settings, topic) => {
  if (!population || population.length === 0) {
    console.error('evolveGeneration called with empty population');
    return [];
  }

  const offspringGenomes = [];
  const eliteSize = Math.min(settings.eliteSize || 1, population.length);

  while (offspringGenomes.length < (settings.populationSize - eliteSize)) {
    const parent1 = selectParent(population);
    const parent2 = selectParent(population);
    
    if (!parent1 || !parent2 || !parent1.genome || !parent2.genome) {
      console.error('Invalid parents selected');
      continue;
    }
    
    let child = crossover(parent1.genome, parent2.genome);
    child = mutate(child, settings.mutationRate);
    
    offspringGenomes.push(child);
  }
  
  if (offspringGenomes.length === 0) {
    console.warn('No offspring created, returning current population');
    return population;
  }
  
  const targetWords = population[0]?.genome?.map(g => g.originalTerm) || [];
  const offspringPhenotypes = await instantiateBatch(offspringGenomes, topic, targetWords);
  
  const offspring = offspringGenomes.map((genome, i) => {
    const rawPhenotype = offspringPhenotypes[i] || {
      sentence: "Evolving keyword match...",
      words: genome.map(g => g.letter + "word")
    };

    const fitnessData = calculateTotalFitness(genome, rawPhenotype);

    return {
      genome,
      phenotype: rawPhenotype,
      fitness: fitnessData.totalFitness,
      orthoScore: fitnessData.orthoScore,
      readScore:fitnessData.readScore,
      id: Math.random()
    };
  });

  const elites = population.slice(0, eliteSize);
  const newPop = [...elites, ...offspring];
  return newPop.sort((a, b) => b.fitness - a.fitness);
};