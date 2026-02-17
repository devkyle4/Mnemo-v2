export const SEMANTIC_ROLES = [
  // noun
  // 'noun_animal', 'noun_person', 'noun_place', 'noun_object','noun_food','noun_idea','noun_time','noun_nature',
  'noun',
  // Actions
  // 'verb_action', 'verb_motion', 'verb_thinking','verb_emotion','verb_modal',
  'verb',

  // Adjectives
  // 'adjective_descriptive','adjective_quantitative','adjective_demonstrative','adjective_possessive','adjective_interrogative',
  // 'adjective_distributive','adjective_proper','adjective_comparative','adjective_superlative','adjective_indefinite','adjective_compound',
  'adjective',
  
  // Abstract
  // 'abstract_concept', 'body_part', 'tool', 'vehicle', 'weather','time_period', 'number_word', 'sound', 'material'
  'random'
];

export const DEFAULT_SETTINGS = {
  populationSize: 5, 
  mutationRate: 0.3,
  eliteSize: 1,       
  maxGenerations: 10,
};

export const DEFAULT_INPUT = `Mercury
Venus
Earth
Mars
Jupiter
Saturn
Uranus
Neptune`;

export const DEFAULT_TOPIC = 'planets in order';