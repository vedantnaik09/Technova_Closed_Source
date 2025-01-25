from fastapi import FastAPI, HTTPException,Request
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError
import os
from gtts import gTTS 
from fastapi.responses import FileResponse
from Meeting_Minutes import Meeting
from task_allocator import summarize_resumes,Tasks
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()
app = FastAPI()
from langchain_google_genai import ChatGoogleGenerativeAI
api_key=os.getenv("GOOGLE_API_KEY")
llms= ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp",api_key=api_key)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def merge_audio_files(audio_files):
    """
    Merge audio files into a single audio file and delete individual files after merging.
    """
    merged_audio = AudioSegment.empty()

    for audio_url in audio_files:
        try:
            # Load the audio file
            audio = AudioSegment.from_file(audio_url)
            # Append the audio to the merged_audio
            merged_audio += audio
            # Delete the individual audio file after merging
            #os.remove(audio_url)
            #print(f"Deleted: {audio_url}")
        except CouldntDecodeError:
            raise HTTPException(status_code=400, detail=f"Could not decode audio file: {audio_url}")
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Audio file not found: {audio_url}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing audio file {audio_url}: {str(e)}")

    # Save the merged audio to a temporary file
    output_file = r"AI\Models\audios\merged_audio.mp3"
    merged_audio.export(output_file, format="mp3")
    return output_file


@app.post("/merge-audio")
async def merge_audio(request: dict):
    """
    Endpoint to merge audio files based on the provided JSON input.
    """
    try:
        # Extract audio URLs from the request
        audio_files = [item["audioURL"] for item in request["data"]]
        users_id = [item["userID"] for item in request["data"]]

        # Merge the audio files
        output_file = merge_audio_files(audio_files)
        text=Meeting(output_file)

        print(text)
        tts = gTTS(text=text, lang='en')  # You can change the language if needed
        tts_output_file = r"AI\Models\audios\tts_output.mp3"
        tts.save(tts_output_file)  # Save the TTS audio file
        os.remove(output_file)
        

        print(f"Text-to-speech audio saved at: {tts_output_file}")
        # Tasks(tts_output_file,users_id)
        # Example usage
        resume_folder = r'AI\Models\resume'  # Update this path to your resume folder
        output_file = r'AI\Models\summarized_resumes.json'  # Update this path to your desired output file
        summarize_resumes(users_id,resume_folder, output_file)
        json_data=Tasks(tts_output_file)
        

        # Return the merged audio file as a downloadable response
        return {
            "json_data":json_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        

@app.post("/answer-question")
async def answer_question(request: Request):
    try:
        data = await request.json()
        user_input = data.get("answer", "")
        
        if not user_input:
            raise HTTPException(status_code=400, detail="No question provided")

        # Get response from Google Generative AI
        response = llms.invoke(user_input)
        
        return {"response": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)