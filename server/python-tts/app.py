from flask import Flask, request, jsonify,Response, send_file
import requests, torch
from flask_cors import CORS
import openpyxl
import base64
import os
import io
from datetime import datetime
from dotenv import load_dotenv
from TTS.api import TTS
import logging
from diffusers import StableDiffusionPipeline, DiffusionPipeline
from save_excel import create_excel_template, EXCEL_FILE_PATH


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')

HUGGINGFACE_MODELS = {
    "stable-diffusion-v3-5": "stabilityai/stable-diffusion-3.5-medium",
    "stable-diffusion-v1-5": "stable-diffusion-v1-5/stable-diffusion-v1-5",
    "stable-diffusion-xl": "stabilityai/stable-diffusion-xl-base-1.0",
    "dreamshaper": "Lykon/dreamshaper-8",
    "openjourney": "prompthero/openjourney-v4",
}


app = Flask(__name__)
CORS(app)

# TTS LOGIC HERE!!!
tts = None

print("Loading XTTS-v2 model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")


print("Model loaded!")

# Cache loaded pipelines so we don't reload on every request
pipeline_cache = {}

def get_pipeline(model_key):
    if model_key in pipeline_cache:
        logger.info(f"Using cached pipeline for {model_key}")
        return pipeline_cache[model_key]

    model_id = HUGGINGFACE_MODELS.get(model_key)
    if not model_id:
        raise ValueError(f"Unknown model: {model_key}")

    logger.info(f"Loading pipeline for {model_id}...")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=dtype,
        safety_checker=None,          # Disable safety checker for speed
        requires_safety_checker=False
    )
    pipe = pipe.to(device)

    # Memory optimizations
    if torch.cuda.is_available():
        pipe.enable_attention_slicing()
    
    pipeline_cache[model_key] = pipe
    logger.info(f"Pipeline loaded on {device}!")
    return pipe

@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        model_key = data.get('model', 'stable-diffusion-v1-5')
        negative_prompt = data.get('negative_prompt', 'blurry, low quality, deformed, ugly, bad anatomy')
        width = int(data.get('width', 512))
        height = int(data.get('height', 512))
        guidance_scale = float(data.get('guidance_scale', 7.5))
        num_inference_steps = int(data.get('num_inference_steps', 50))
        seed = data.get('seed', None)

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Load (or retrieve cached) pipeline
        pipe = get_pipeline(model_key)

        # Set seed if provided
        generator = None
        if seed is not None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            generator = torch.Generator(device=device).manual_seed(int(seed))

        logger.info(f"Generating image | model={model_key} steps={num_inference_steps} guidance={guidance_scale} size={width}x{height}")

        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator
        )

        image = result.images[0]

        # Convert PIL image to base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        return jsonify({
            'image': f"data:image/png;base64,{image_base64}",
            'model': model_key,
            'parameters': {
                'width': width,
                'height': height,
                'guidance_scale': guidance_scale,
                'num_inference_steps': num_inference_steps,
                'seed': seed
            }
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    

@app.route('/save', methods=['POST'])
def save_mnemonic():
    try:
        data = request.json

        required_fields = ['generation','population','settings', 'bestFitness', 'topic', 'bestMnemonic']

        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success':False,
                    'error': f'Missing required field: {field}'
                }),400
            
        # Check if Excel file exists, if not create
        if not os.path.exists(EXCEL_FILE_PATH):
            print("Excel file not found, creating new one...")
            create_excel_template()

        # Load existing workbook
        workbook = openpyxl.load_workbook(EXCEL_FILE_PATH)
        sheet = workbook.active

        #Prepre row data
        new_row = [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  
            data.get('generation', 0),                     
            float(data.get('bestFitness', 0)),             
            float(data.get('avgFitness', 0)),              
            float(data.get('genomeFitness', 0)),           
            float(data.get('orthoScore', 0)),              
            int(data.get('populationSize', 5)),            
            float(data.get('mutationRate', 0.15)),         
            int(data.get('eliteSize', 1)),                 
            int(data.get('maxGenerations', 20)),           
            data.get('topic', 'N/A'),                      
            data.get('bestMnemonic', 'N/A'),               
            data.get('targetTerms', 'N/A')                 
            ]

        # Append row
        sheet.append(new_row)

        # Save workbook
        workbook.save(EXCEL_FILE_PATH)

        row_number = sheet.max_row

        logger.info(f'Data Saved to row {row_number}')

        return jsonify({
            'success': True,
            'message': 'Data saved successfully',
            'row': row_number
        }),200


    except Exception as e:
        logger.exception("Save failed")
        return jsonify({
            "success": False,
            "error":str(e)
            }),500

@app.route('/download', methods=['GET'])
def download_evolution_data():
    """Download the Excel file"""
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            return jsonify({
                'success': False,
                'error': 'Excel file not found. Save some data first.'
            }), 404
        
        return send_file(
            EXCEL_FILE_PATH,
            as_attachment=True,
            download_name='evolution_data.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        print(f'Error downloading file: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@app.route('/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text')
        language = data.get('language', 'en')
        speaker = data.get('speaker', 'Ana Florence')

        print(f'speaker:', speaker)
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        if not tts:
            return jsonify({"error": "Model not loaded"}), 503
        
        logger.info("Generating Speech: {text[:50]}...")
        

        # Generate audio to memory buffer
        wav_buffer = io.BytesIO()
        tts.tts_to_file(
            text=text,
            language=language,
            speaker=speaker,
            file_path=wav_buffer
        )

        wav_buffer.seek(0)
        
        return Response(
            wav_buffer.read(),
            mimetype='audio/wav',
            headers={'Content-Disposition': 'inline'}
        )
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@app.route('/tts/speakers', methods=['GET'])
def get_speakers():
    try:
        if not tts:
            return jsonify({"error": "Model not loaded"}), 503
        
        speakers = tts.speakers if hasattr(tts, 'speakers') else []
        return jsonify({
            "speakers": speakers,
            "default": "Ana Florence"
        })
    except Exception as e:
        logger.error(f"Error getting speakers: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/mistral', methods=['POST'])
def create_mnemonics():
    data = request.json
    prompt = data.get('prompt', '')

    headers = {
        'Authorization': f'Bearer {MISTRAL_API_KEY}',
        'Content-Type':'application/json',
    }

    payload ={
        'model':'mistral-tiny',
        'messages':[{'role':'user', 'content': prompt}],
        'temperature': 0.5,
    }

    app.logger.debug(f"Sending payload to Mistral: {payload}")

    try:
        response = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers=headers,
            json=payload
        )
        app.logger.debug(f"Mistral API response: {response.text}")

        response.raise_for_status()
        response_json = response.json()

        # Strip markdown formatting from content
        if 'choices' in response_json and len(response_json['choices']) > 0:
            content = response_json['choices'][0]['message']['content']
            # Remove all markdown bold/italic markers
            content = content.replace('**', '').replace('__', '').replace('*', '').replace('_', '')
            response_json['choices'][0]['message']['content'] = content

        return jsonify(response_json)
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            app.logger.error(f"Response content: {e.response.text}")
        return jsonify({'error': str(e)}), 500
    except KeyError:
        return jsonify({'error': 'Invalid request: "prompt" field missing'}), 400
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f"Starting CoquiTTS server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
