import { useState, useEffect } from 'react';
import { Image, Wand2, RefreshCw, Download, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const MODELS = [
    {
        key: 'stable-diffusion-v3-5',
        label: 'Stable Diffusion 3.5',
        description: 'High quality, detailed'
    },
        {
        key: 'stable-diffusion-v1-5',
        label: 'Stable Diffusion 1.5',
        description: 'Fast, reliable, versatile'
    },
    {
        key: 'stable-diffusion-xl',
        label: 'SD XL',
        description: 'Highest quality, slower'
    },
    {
        key: 'dreamshaper',
        label: 'Dreamshaper',
        description: 'Artistic, painterly'
    },
    {
        key: 'openjourney',
        label: 'Openjourney',
        description: 'Midjourney-like'
    },
];

const DEFAULT_PARAMS = {
    negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy',
    width: 512,
    height: 512,
    guidance_scale: 7.5,
    num_inference_steps: 50,
    seed: '',
};

const GenerateImage = ({ sentence, isRunning, generation, maxGenerations }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('stable-diffusion-1.5');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [params, setParams] = useState(DEFAULT_PARAMS);

    // Load best mnemonic into prompt box when it changes
    useEffect(() => {
        if (sentence) {
            setPrompt(`A vivid educational illustration of: "${sentence}". Colorful, detailed, memorable scene.`);
        }
    }, [sentence]);

    const updateParam = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: selectedModel,
                    negative_prompt: params.negative_prompt,
                    width: Number(params.width),
                    height: Number(params.height),
                    guidance_scale: Number(params.guidance_scale),
                    num_inference_steps: Number(params.num_inference_steps),
                    seed: params.seed !== '' ? Number(params.seed) : null,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Image generation failed');
            }

            setGeneratedImage(data.image);

        } catch (err) {
            console.error('Image generation error:', err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `mnemonic-${selectedModel}-${Date.now()}.jpg`;
        link.click();
    };

    const handleRandomSeed = () => {
        updateParam('seed', Math.floor(Math.random() * 2147483647));
    };

    return (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-purple-100 h-full flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                Image Generator
            </h2>

            {/* Model Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <div className="grid grid-cols-2 gap-2">
                    {MODELS.map((model) => (
                        <button
                            key={model.key}
                            onClick={() => setSelectedModel(model.key)}
                            className={`p-2 rounded-lg border text-left transition ${
                                selectedModel === model.key
                                    ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                                    : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                            }`}
                        >
                            <div className="text-xs font-semibold text-gray-800">{model.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt Box */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt
                    {sentence && (
                        <button
                            onClick={() => setPrompt(`A vivid educational illustration of: "${sentence}". Colorful, detailed, memorable scene.`)}
                            className="ml-2 text-xs text-purple-600 hover:underline font-normal"
                        >
                            ↺ Reset to mnemonic
                        </button>
                    )}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    placeholder="Describe the image you want to generate..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                />
            </div>

            {/* Advanced Parameters Toggle */}
            <div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 transition"
                >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Parameters
                </button>

                {showAdvanced && (
                    <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">

                        {/* Negative Prompt */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Negative Prompt
                            </label>
                            <textarea
                                value={params.negative_prompt}
                                onChange={(e) => updateParam('negative_prompt', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                        </div>

                        {/* Width & Height */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Width: {params.width}px
                                </label>
                                <input
                                    type="range"
                                    min={256}
                                    max={1024}
                                    step={64}
                                    value={params.width}
                                    onChange={(e) => updateParam('width', e.target.value)}
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                    <span>256</span>
                                    <span>1024</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Height: {params.height}px
                                </label>
                                <input
                                    type="range"
                                    min={256}
                                    max={1024}
                                    step={64}
                                    value={params.height}
                                    onChange={(e) => updateParam('height', e.target.value)}
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                    <span>256</span>
                                    <span>1024</span>
                                </div>
                            </div>
                        </div>

                        {/* Guidance Scale */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Guidance Scale: {params.guidance_scale}
                                <span className="text-gray-400 font-normal ml-1">(how closely to follow prompt)</span>
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                step={0.5}
                                value={params.guidance_scale}
                                onChange={(e) => updateParam('guidance_scale', e.target.value)}
                                className="w-full accent-purple-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                <span>1 (creative)</span>
                                <span>20 (strict)</span>
                            </div>
                        </div>

                        {/* Inference Steps */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Inference Steps: {params.num_inference_steps}
                                <span className="text-gray-400 font-normal ml-1">(more = better quality, slower)</span>
                            </label>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={params.num_inference_steps}
                                onChange={(e) => updateParam('num_inference_steps', e.target.value)}
                                className="w-full accent-purple-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                <span>10 (fast)</span>
                                <span>100 (slow)</span>
                            </div>
                        </div>

                        {/* Seed */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Seed
                                <span className="text-gray-400 font-normal ml-1">(empty = random)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={params.seed}
                                    onChange={(e) => updateParam('seed', e.target.value)}
                                    placeholder="Leave empty for random"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={handleRandomSeed}
                                    className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs hover:bg-purple-100 transition"
                                >
                                    🎲 Random
                                </button>
                                <button
                                    onClick={() => updateParam('seed', '')}
                                    className="px-3 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Reset all */}
                        <button
                            onClick={() => setParams(DEFAULT_PARAMS)}
                            className="text-xs text-gray-500 hover:text-red-500 transition"
                        >
                            ↺ Reset all parameters
                        </button>
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-white transition ${
                    isGenerating || !prompt.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg'
                }`}
            >
                {isGenerating ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Wand2 className="w-4 h-4" />
                        Generate Image
                    </>
                )}
            </button>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    ⚠️ {error}
                </div>
            )}

            {/* Generated Image */}
            {generatedImage && (
                <div className="flex flex-col gap-2">
                    <img
                        src={generatedImage}
                        alt="Generated mnemonic illustration"
                        className="w-full rounded-lg border border-purple-100 shadow-md"
                    />
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download Image
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!generatedImage && !isGenerating && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-6">
                    <Image className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm text-center">Generated image will appear here</p>
                </div>
            )}
        </div>
    );
};

export default GenerateImage;