import os
import google.generativeai as genai
import pathlib
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
audio_file_path = pathlib.Path(r'test.mp3')
audio_bytes = audio_file_path.read_bytes()
model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
prompt="""
Your task is to create the minutes of the meeting and important points discussed in the meet don't create the transcription i just need minutes in 100-200 words.
"""
response = model.generate_content(
        [
    prompt,
    {
        "mime_type": "audio/mp3",
        "data": audio_bytes
    }
]
    )


# Output Gemini's response to the prompt and the inline audio.
print(response.text)