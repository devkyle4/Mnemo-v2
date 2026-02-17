const DATA_BACKEND_URL = import.meta.env.VITE_DATA_BACKEND_URL || 'http://localhost:3000';

export const SaveData = async (
    generation,
    population,
    bestSolution,
    settings,
    topic,
    parsedTerms
) => {
    try {

        // Validate we have data to save
        if (!bestSolution || !population || population.length === 0) {
            return {
                success: false,
                error: 'No evolution data to save. Please run the evolution again!'
            };
        }

        // Calculate statistics CORRECTLY
        const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
        const genomeFitness = bestSolution.genomeFitness || 0;

        const payload = {
            generation: generation,
            population:population,
            bestFitness: bestSolution.fitness.toFixed(2),
            avgFitness: avgFitness.toFixed(2),
            genomeFitness: genomeFitness.toFixed(2),
            orthoScore: (bestSolution.orthoScore || 0).toFixed(2),
            populationSize: settings.populationSize,
            mutationRate: settings.mutationRate,
            eliteSize: settings.eliteSize,
            maxGenerations: settings.maxGenerations,
            settings: settings,
            topic: topic,
            bestMnemonic: bestSolution.phenotype?.sentence || 'N/A',
            targetTerms: parsedTerms.join(', ')
        };

        console.log('Sending data to Excel file via backend:', payload);

        const response = await fetch(`${DATA_BACKEND_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();


        if (response.ok && result.success) {
            console.log('Data saved successfully to row:', result.row);
            return {
                success: true,
                message: `Data saved to row ${result.row}`,
                row: result.row
            };
        } else {
            console.error('Save failed:', result.error);
            return {
                success: false,
                error: result.error || 'Unknown error occurred'
            };
        }

    } catch (error) {
        console.error('Error saving evolution data:', error);
        return {
            success: false,
            error: `Network error: ${error.message}. Is your Flask server running on port 3000?`
        };
    }
};

export const downloadSaveDataFile = async () => {
    try {
        const response = await fetch(`${DATA_BACKEND_URL}/download`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download file from server');
        }

        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evolution_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('File downloaded successfully');
        return { success: true };

    } catch (error) {
        console.error('Error downloading file:', error);
        return {
            success: false,
            error: `Download failed: ${error.message}`
        };
    }
};