// SettingsPanel.jsx - Component for GA parameter configuration

import React from 'react';

const SettingsPanel = ({ settings, setSettings, isRunning }) => {
  // Helper to ensure Elite size doesn't exceed Population size
  const handlePopSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setSettings({
      ...settings, 
      populationSize: newSize,
      // Auto-adjust elite size if it becomes larger than population
      eliteSize: Math.min(settings.eliteSize, newSize - 1) 
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 mb-4 border border-purple-200">
      <h3 className="text-lg font-semibold mb-4 text-purple-900">Genetic Algorithm Parameters</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1 font-medium">Population Size</label>
          <input
            type="number"
            value={settings.populationSize}
            onChange={handlePopSizeChange}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isRunning}
            min="3"
            max="20" /* CHANGED: Capped at 20 to prevent LLM token overflow */
          />
          <p className="text-[10px] text-gray-500 mt-1">Batch limit: 20</p>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1 font-medium">Mutation Rate</label>
          <input
            type="number"
            step="0.05"
            value={settings.mutationRate}
            onChange={(e) => setSettings({...settings, mutationRate: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isRunning}
            min="0"
            max="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1 font-medium">Elite Size</label>
          <input
            type="number"
            value={settings.eliteSize}
            onChange={(e) => setSettings({...settings, eliteSize: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isRunning}
            min="0"
            max={Math.max(0, settings.populationSize - 1)} /* Logic check added */
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1 font-medium">Max Generations</label>
          <input
            type="number"
            value={settings.maxGenerations}
            onChange={(e) => setSettings({...settings, maxGenerations: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isRunning}
            min="1" /* Lowered min so you can do quick tests */
            max="100"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;