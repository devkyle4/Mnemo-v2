// gaEngine.jsx - Fixed version with validation and progressive rate limiting

import { generateGenome, crossover, mutate } from './genomeUtils';
import { instantiateBatch } from '../services/llmService'; 
import { calculateTotalFitness } from './fitnessCalculator';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates and ensures fitness is a valid number
 */
const validateFitness = (fitness) => {
  if (typeof fitness !== 'number' || isNaN(fitness) || !isFinite(fitness)) {
    console.warn('Invalid fitness detected, defaulting to 0:', fitness);
    return 0;
  }
  return fitness;
};

/**
 * Initializes the population by creating all genomes first, 
 * then instantiating them in one LLM batch call.
 */
export const initializePopulation = async (firstLetters, topic, populationSize) => {
  const genomes = Array.from({ length: populationSize }, () => generateGenome(firstLetters));
  
  
  // Initial delay before first API call
  console.log('Initializing population...');
  await delay(1000);
  
  const phenotypes = await instantiateBatch(genomes, topic);
  
  // Assemble and Score with validation
  const pop = genomes.map((genome, i) => {
    const phenotype = phenotypes[i];
    
  // Ensure phenotype has valid structure
    if (!phenotype || typeof phenotype !== 'object') {
      console.warn('Invalid phenotype at index', i, phenotype);
      phenotype = {
        sentence: genome.map(slot => `${slot.letter}...`).join(' '),
        words: [],
        memorability_score: 50,
        coherence_score: 50
      };
    }
    
    const fitness = validateFitness(calculateTotalFitness(genome, phenotype));
    
    return {
      genome,
      phenotype,
      fitness,
      id: Math.random()
    };
  });
  
  return pop.sort((a, b) => b.fitness - a.fitness);
};

/**
 * Evolves the generation by creating all offspring genomes locally,
 * then instantiating the entire new generation in one LLM batch call.
 */
export const evolveGeneration = async (population, settings, topic, currentGeneration = 0) => {
  const offspringGenomes = [];
  const eliteSize = settings.eliteSize || 1;

  // 1. Keep Elites (No LLM call needed, they already have phenotypes)
  const elites = population.slice(0, eliteSize);
  
  // 2. Structural Evolution for Offspring (Local/Instant)
  const offspringCount = settings.populationSize - eliteSize;
  for (let i = 0; i < offspringCount; i++) {
    const parent1 = selectParent(population);
    const parent2 = selectParent(population);
    
    let childGenome = crossover(parent1.genome, parent2.genome);
    childGenome = mutate(childGenome, settings.mutationRate);
    offspringGenomes.push(childGenome);
  }
  
  // 3. Progressive delay with extra pauses every 5 generations
  const baseDelay = 3000; // 3 seconds base delay
  const extraDelay = (currentGeneration > 0 && currentGeneration % 5 === 0) ? 3000 : 0; // Extra 3s every 5 gens
  const totalDelay = baseDelay + extraDelay;
  
  console.log(`Generation ${currentGeneration}: Waiting ${totalDelay/1000}s before API call...`);
  await delay(totalDelay);
  
  // 4. Batch Phenotype Expression for all new offspring
  const offspringPhenotypes = await instantiateBatch(offspringGenomes, topic);
  
  // 5. Assemble Offspring with validation
  const offspring = offspringGenomes.map((genome, i) => {
    const phenotype = offspringPhenotypes[i];
    
    // Ensure phenotype has valid structure
    if (!phenotype || typeof phenotype !== 'object') {
      console.warn('Invalid phenotype at index', i, phenotype);
      phenotype = {
        sentence: genome.map(slot => `${slot.letter}...`).join(' '),
        words: [],
        memorability_score: 50,
        coherence_score: 50
      };
    }
    
    const fitness = validateFitness(calculateTotalFitness(genome, phenotype));
    
    return {
      genome,
      phenotype,
      fitness,
      id: Math.random()
    };
  });
  
  // 6. Combine and Sort
  const newPop = [...elites, ...offspring];
  return newPop.sort((a, b) => b.fitness - a.fitness);
};

export const selectParent = (population) => {
  const tournamentSize = 3;
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    tournament.push(population[Math.floor(Math.random() * population.length)]);
  }
  return tournament.sort((a, b) => b.fitness - a.fitness)[0];
};

export const calculateDiversity = (population) => {
  return new Set(population.map(ind => JSON.stringify(ind.genome))).size;
};

export const calculateAverageFitness = (population) => {
  if (population.length === 0) return 0;
  const validFitnesses = population.map(ind => validateFitness(ind.fitness));
  return validFitnesses.reduce((sum, fitness) => sum + fitness, 0) / population.length;
};