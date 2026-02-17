// textParser.js - Text parsing utilities

export const parseTerms = (inputText) => {
  const lines = inputText.split('\n').filter(line => line.trim());
  return lines.map(line => line.trim().replace(/^[•\-*]\s*/, ''));
};

export const getFirstLetters = (terms) => {
  return terms.map(term => term[0].toUpperCase());
};