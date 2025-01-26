import os
import google.generativeai as genai
import pathlib
from dotenv import load_dotenv

def Meeting(audio_file_path):
    # Load environment variables from .env file
    load_dotenv()
    
    # Set the Google API key from the environment variable
    os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    # Read the audio file as bytes
    audio_bytes = pathlib.Path(audio_file_path).read_bytes()
    
    # Initialize the GenerativeModel with the specified model
    model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
    
    # Define the prompt for generating meeting minutes
    prompt = """
    Your task is to create the minutes of the meeting and important points discussed in the meet. 
    Don't create the transcription; I just need sentiment analysis in 100-200 words.
    """
    
    # Generate the meeting minutes using the model
    response = model.generate_content(
        [
            prompt,
            {
                "mime_type": "audio/mp3",
                "data": audio_bytes
            }
        ]
    )
    
    # Return the generated meeting minutes
    return response.text

text=Meeting(r"AI\Models\test.mp3")
print(text)