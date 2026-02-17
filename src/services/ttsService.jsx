const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";


export const getAvailableSpeakers = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/tts/speakers`);
    if (!response.ok) {
      throw new Error('Failed to fetch speakers');
    }
    const data = await response.json();
    return data.speakers || [];
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return ['Ana Florence']; 
  }
};

export const generateSpeechAndPlay = async (text, speaker = 'Ana Florence') => {
  try {
    const response = await fetch(`${BACKEND_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text,
        language: 'en',
        speaker 
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return audio;
  } catch (error) {
    console.error('TTS Error:', error);
    throw error;
  }
};
