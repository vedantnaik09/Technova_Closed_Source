import os
from deepgram import DeepgramClient, PrerecordedOptions, FileSource

import logging
from dotenv import load_dotenv
load_dotenv()
API_KEY =os.getenv("DEEPGRAM_API_KEY")
print(API_KEY)
# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def Transcriber(AUDIO_FILE):
    try:
        # STEP 1: Create a Deepgram client using the API key
        deepgram = DeepgramClient(API_KEY)
        logger.info("Deepgram client created successfully.")

        # Read the audio file
        with open(AUDIO_FILE, "rb") as file:
            buffer_data = file.read()
        logger.info("Audio file read successfully.")

        payload: FileSource = {
            "buffer": buffer_data,
        }

        # STEP 2: Configure Deepgram options for audio analysis
        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language="hi"
        )
        logger.info("Deepgram options configured successfully.")

        # STEP 3: Call the transcribe_file method with the text payload and options
        response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
        logger.info("Transcription response received.")

        # Extract the transcript from the response
        transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
        logger.info("Transcript extracted successfully.")

        # Translate the transcript
        logger.info("Transcript translated successfully.")
        
        # print(translated_transcript)
        return transcript

    except Exception as e:
        logger.error(f"Exception: {e}")
        return None


