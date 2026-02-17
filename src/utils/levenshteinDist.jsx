export const levenshteinDistance = (str1, str2) => {
  // Safety checks - ensure inputs are strings
  if (str1 === null || str1 === undefined) str1 = '';
  if (str2 === null || str2 === undefined) str2 = '';
  
  // Convert to strings if they aren't already
  str1 = String(str1).toLowerCase();
  str2 = String(str2).toLowerCase();
  
  const costs = [];
  for (let i = 0; i <= str1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[str2.length] = lastValue;
  }
  return costs[str2.length];
};