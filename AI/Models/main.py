from collections import defaultdict
from fastapi import FastAPI, HTTPException,Request
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError
import os
from bson import ObjectId
import json
from gtts import gTTS 
import base64
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from Meeting_Minutes import Meeting
from task_allocator import summarize_resumes,Tasks
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
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
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import string
import smtplib

def send_email(recipient_email: str, subject: str, body: str):
    sender_email = "nops58279@gmail.com"  
    sender_password = "ptzc xxuv iswd mzza"  
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = subject

    message.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Secure the connection
            server.login(sender_email, sender_password)  # Login to the server
            server.sendmail(sender_email, recipient_email, message.as_string())  # Send the email

        print(f"Email sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email to {recipient_email}: {e}")
        
import ffmpeg
import requests
import tempfile
import os
from fastapi import HTTPException

def merge_audio_files(audio_urls):
    """
    Merge audio files from URLs into a single audio file using ffmpeg.
    """
    print(f"[DEBUG] Starting merge_audio_files with {len(audio_urls)} audio URLs")
    temp_files = []
    input_files = []

    try:
        # Download all files first
        for i, audio_url in enumerate(audio_urls):
            print(f"[DEBUG] Downloading audio file {i+1}: {audio_url}")
            response = requests.get(audio_url)
            
            if response.status_code != 200:
                print(f"[ERROR] Failed to download audio from {audio_url}. Status code: {response.status_code}")
                raise HTTPException(status_code=response.status_code,
                                  detail=f"Failed to download audio from {audio_url}")

            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.webm')
            temp_files.append(temp_file.name)
            print(f"[DEBUG] Created temporary file: {temp_file.name}")

            with open(temp_file.name, 'wb') as f:
                f.write(response.content)
            print(f"[DEBUG] Wrote {len(response.content)} bytes to {temp_file.name}")

            input_files.append(temp_file.name)

        # Create output directory if it doesn't exist
        os.makedirs(r"AI/Models/audios", exist_ok=True)
        output_file = r"AI/Models/audios/merged_audio.mp3"
        print(f"[DEBUG] Output directory created. Output file will be: {output_file}")

        # Prepare filter complex for concatenation
        filter_complex = '[0]'
        for i in range(1, len(input_files)):
            filter_complex += f'[{i}]'
        filter_complex += f'concat=n={len(input_files)}:v=0:a=1[outa]'
        print(f"[DEBUG] FFmpeg filter complex: {filter_complex}")

        # Merge audio files
        print("[DEBUG] Preparing to merge audio files")
        stream = ffmpeg.input(input_files[0])
        for input_file in input_files[1:]:
            stream = ffmpeg.input(input_file)
            print(f"[DEBUG] Added input file: {input_file}")

        stream = ffmpeg.output(stream, output_file, acodec='libmp3lame')
        print("[DEBUG] FFmpeg stream prepared. Running merge...")
        ffmpeg.run(stream, overwrite_output=True)
        print("[DEBUG] Audio merge completed successfully")

        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
                print(f"[DEBUG] Deleted temporary file: {temp_file}")
            except Exception as cleanup_error:
                print(f"[ERROR] Failed to delete temporary file {temp_file}: {cleanup_error}")

        return output_file

    except Exception as e:
        print(f"[CRITICAL ERROR] An exception occurred: {e}")
        print(f"[DEBUG] Exception type: {type(e).__name__}")
        print(f"[DEBUG] Temporary files: {temp_files}")
        print(f"[DEBUG] Input files: {input_files}")
        raise HTTPException(status_code=500, detail=str(e))
db_url = os.getenv("MONGODB_URI")
print("The database URL is:", db_url)
client = MongoClient(db_url)  # Update with your MongoDB connection string
db = client["test"]  # Replace with your database name
collection = db["logs"]  # Replace with your collection name
from fastapi import HTTPException
from datetime import datetime
import matplotlib.pyplot as plt
from io import BytesIO
from fastapi.responses import StreamingResponse

def extract_file_name(file_path):
    """
    Extract the file name from a full file path.
    """
    return os.path.basename(file_path)
import numpy as np
@app.get('/get-chart')
async def get_chart(userid: str):
    """
    Endpoint to generate multiple plots for a given user:
    1. Time series of total changes.
    2. First-order differences.
    3. Hourly file activity (grouped histogram).
    4. Total changes per file.
    5. Changes over time grouped by repository.
    6. Top 5 most active files.
    7. Changes distribution (pie chart).
    """
    try:
        # Get records from MongoDB
        records = collection.find({"employeeID": userid})
        print(records)
        data_list = list(records)

        if not data_list:
            return {"message": "No data found"}

        # Extract and process data
        timestamps = []
        total_changes = []
        files_data = []
        repos_data = []

        for record in data_list:
            timestamps.append(datetime.fromisoformat(record['timestamp']))
            total_changes.append(record['totalChanges'])
            for file in record['files']:
                files_data.append({
                    "filePath": extract_file_name(file['filePath']),  # Extract file name
                    "repo": file['repo'],
                    "changes": file['changes'],
                    "timestamp": datetime.fromisoformat(record['timestamp'])
                })
                repos_data.append(file['repo'])
        print('done transformation')        

        # Sort data chronologically
        sorted_data = sorted(zip(timestamps, total_changes), key=lambda x: x[0])
        dates = [item[0] for item in sorted_data]
        changes = [item[1] for item in sorted_data]

        
        plt.figure(figsize=(12, 6))
        plt.plot(dates, changes, marker='o', linestyle='-', color='b')
        plt.title(f'Time Series of Total Changes (Employee {userid})')
        plt.xlabel('Timestamp')
        plt.ylabel('Total Changes')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()

        # Save plot to bytes buffer
        buf_total_changes = BytesIO()
        plt.savefig(buf_total_changes, format='png', dpi=100)
        plt.close()
        buf_total_changes.seek(0)
        img_total_changes = base64.b64encode(buf_total_changes.read()).decode('utf-8')

        # Plot 2: First-order differences
        img_diff_base64 = None
        if len(changes) >= 2:
            differences = [changes[i] - changes[i-1] for i in range(1, len(changes))]
            diff_dates = dates[1:]

            plt.figure(figsize=(12, 6))
            plt.plot(diff_dates, differences, marker='o', linestyle='-', color='r')
            plt.title(f'First-Order Differences (Employee {userid})')
            plt.xlabel('Timestamp')
            plt.ylabel('Change Difference')
            plt.grid(True)
            plt.xticks(rotation=45)
            plt.tight_layout()

            buf_diff = BytesIO()
            plt.savefig(buf_diff, format='png', dpi=100)
            plt.close()
            buf_diff.seek(0)
            img_diff_base64 = base64.b64encode(buf_diff.read()).decode('utf-8')

        # Plot 3: Hourly file activity (grouped histogram)
        hourly_activity = defaultdict(lambda: defaultdict(int))
        for file in files_data:
            hour = file['timestamp'].strftime('%Y-%m-%d %H:00')
            hourly_activity[hour][file['filePath']] += file['changes']

        hours = sorted(hourly_activity.keys())
        file_paths = list(set(file['filePath'] for file in files_data))
        bottom = np.zeros(len(hours))

        plt.figure(figsize=(12, 6))
        for file_path in file_paths:
            changes_per_hour = [hourly_activity[hour][file_path] for hour in hours]
            plt.bar(hours, changes_per_hour, label=file_path, bottom=bottom)
            bottom += np.array(changes_per_hour)

        plt.title(f'Hourly File Activity (Employee {userid})')
        plt.xlabel('Hour')
        plt.ylabel('Changes')
        plt.xticks(rotation=45)
        plt.legend()
        plt.tight_layout()

        buf_hourly = BytesIO()
        plt.savefig(buf_hourly, format='png', dpi=100)
        plt.close()
        buf_hourly.seek(0)
        img_hourly = base64.b64encode(buf_hourly.read()).decode('utf-8')

        # Plot 4: Total changes per file
        file_changes = defaultdict(int)
        for file in files_data:
            file_changes[file['filePath']] += file['changes']

        plt.figure(figsize=(12, 6))
        plt.bar(file_changes.keys(), file_changes.values(), color='orange')
        plt.title(f'Total Changes per File (Employee {userid})')
        plt.xlabel('File Name')  # Updated label
        plt.ylabel('Total Changes')
        plt.xticks(rotation=45)
        plt.tight_layout()

        buf_file_changes = BytesIO()
        plt.savefig(buf_file_changes, format='png', dpi=100)
        plt.close()
        buf_file_changes.seek(0)
        img_file_changes = base64.b64encode(buf_file_changes.read()).decode('utf-8')

        # Plot 5: Changes over time grouped by repository
        repo_changes = defaultdict(list)
        for file in files_data:
            repo_changes[file['repo']].append((file['timestamp'], file['changes']))

        plt.figure(figsize=(12, 6))
        for repo, changes in repo_changes.items():
            dates = [x[0] for x in changes]
            changes = [x[1] for x in changes]
            plt.plot(dates, changes, marker='o', linestyle='-', label=repo)

        plt.title(f'Changes Over Time by Repository (Employee {userid})')
        plt.xlabel('Timestamp')
        plt.ylabel('Changes')
        plt.legend()
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()

        buf_repo_changes = BytesIO()
        plt.savefig(buf_repo_changes, format='png', dpi=100)
        plt.close()
        buf_repo_changes.seek(0)
        img_repo_changes = base64.b64encode(buf_repo_changes.read()).decode('utf-8')

        # Plot 6: Top 5 most active files
        top_files = sorted(file_changes.items(), key=lambda x: x[1], reverse=True)[:5]
        top_file_names = [x[0] for x in top_files]
        top_file_changes = [x[1] for x in top_files]

        plt.figure(figsize=(12, 6))
        plt.bar(top_file_names, top_file_changes, color='purple')
        plt.title(f'Top 5 Most Active Files (Employee {userid})')
        plt.xlabel('File Name')  # Updated label
        plt.ylabel('Total Changes')
        plt.xticks(rotation=45)
        plt.tight_layout()

        buf_top_files = BytesIO()
        plt.savefig(buf_top_files, format='png', dpi=100)
        plt.close()
        buf_top_files.seek(0)
        img_top_files = base64.b64encode(buf_top_files.read()).decode('utf-8')

        # Plot 7: Changes distribution (pie chart)
        repo_total_changes = defaultdict(int)
        for file in files_data:
            repo_total_changes[file['repo']] += file['changes']

        plt.figure(figsize=(8, 8))
        plt.pie(repo_total_changes.values(), labels=repo_total_changes.keys(), autopct='%1.1f%%')
        plt.title(f'Changes Distribution by Repository (Employee {userid})')

        buf_pie = BytesIO()
        plt.savefig(buf_pie, format='png', dpi=100)
        plt.close()
        buf_pie.seek(0)
        img_pie = base64.b64encode(buf_pie.read()).decode('utf-8')

        # Prepare response data
        response_data = {
            "total_changes_image": img_total_changes,
            "differences_image": img_diff_base64,
            "hourly_activity_image": img_hourly,
            "file_changes_image": img_file_changes,
            "repo_changes_image": img_repo_changes,
            "top_files_image": img_top_files,
            "pie_chart_image": img_pie
        }

        return JSONResponse(content=response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/merge-audio")
# async def merge_audio(request: dict):
#     """
#     Endpoint to merge audio files based on the provided JSON input.
#     """
#     try:
#         # Extract audio URLs from the request
#         audio_files = [item["audioURL"] for item in request["data"]]
#         users_id = [item["userID"] for item in request["data"]]

#         # Merge the audio files
#         output_file = merge_audio_files(audio_files)
#         text=Meeting(output_file)

#         print(text)
#         tts = gTTS(text=text, lang='en')  # You can change the language if needed
#         tts_output_file = r"AI\Models\audios\tts_output.mp3"
#         tts.save(tts_output_file)  # Save the TTS audio file
#         os.remove(output_file)
        

#         print(f"Text-to-speech audio saved at: {tts_output_file}")
#         # Tasks(tts_output_file,users_id)
#         # Example usage
#         resume_folder = r'AI\Models\resume'  # Update this path to your resume folder
#         output_file = r'AI\Models\summarized_resumes.json'  # Update this path to your desired output file
#         summarize_resumes(users_id,resume_folder, output_file)
#         json_data=Tasks(tts_output_file)
#         with open("sample_output.json", "w") as json_file:
#             json.dump(json_data, json_file, indent=4)

#         # Return the merged audio file as a downloadable response
#         return {
#             "json_data":json_data
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

import uuid
@app.post("/merge-audio")
async def merge_audio(request: dict):
    """
    Endpoint to merge audio files, process tasks, and insert into MongoDB.
    """
    try:
        # Extract audio URLs from the request
        audio_files = [item["audioURL"] for item in request["data"]]
        users_id = [item["userID"] for item in request["data"]]

        # Merge the audio files
        output_file = merge_audio_files(audio_files)
        text = Meeting(output_file)

        # Generate text-to-speech audio
        tts = gTTS(text=text, lang='en')
        tts_output_file = r"AI\Models\audios\tts_output.mp3"
        tts.save(tts_output_file)
        os.remove(output_file)
        print("bad")
        # Process resumes and generate tasks
        resume_folder = r'AI\Models\resume'
        output_file = r'AI\Models\summarized_resumes.json'
        summarize_resumes(users_id, resume_folder, output_file)
        print("gud")
        # Generate tasks JSON
        json_data = Tasks(tts_output_file)
        collection_task = db["tasks"]
        collection_users = db["users"] 

        

        # Process task assignments
        task_assignments = json_data.get("task_assignments", [])
        inserted_tasks = []

        for assignment in task_assignments:
            user_id = assignment.get("user_id")
            task_deadline = assignment.get("task_deadline")
            tasks_summary = assignment.get("tasks_summary", [])
            try:
                user_id_obj = ObjectId(user_id)
            except Exception as e:
                print(f"Invalid user_id: {user_id}, error: {e}")
                continue 
            user = collection_users.find_one({"_id": user_id_obj}) 
            user_email = user.get("email") if user else None
            # Subject for the email
            subject = "New Task Assignment"

# Format the task summary separately
            task_summary_formatted = "\n".join([f"- {task}" for task in tasks_summary])

# Body for the email
            body = f"""
Dear User,

You have been assigned a new task with the following details:

Task Summary:
{task_summary_formatted}

Deadline: {task_deadline}

Please ensure that the task is completed by the specified deadline.

Best regards,
Your Team
"""
            send_email(user_email,subject,body)
            print("mail sended")
            # Parse deadline hours
            try:
                deadline_hours = int(task_deadline.replace("hrs", "").replace("hr", "").strip())
            except ValueError:
                print(f"Invalid task_deadline format: {task_deadline}")
                continue

            # Number of tasks
            num = len(tasks_summary)

            for i, task_summary in enumerate(tasks_summary):
                # Generate unique task ID
                unique_task_id = str(uuid.uuid4())

                # Calculate estimated hours per task
                estimated_hours = deadline_hours // num

                # Create task document
                task_document = {
                    "_id": unique_task_id,
                    "assignedTo": user_id,
                    "description": task_summary,
                    "estimatedHours": estimated_hours,
                    "status": "TODO",
                    "priority": i + 1,
                    "aiMetadata": "ai",
                    "title": "status",
                    "project_id": "sample_id"
                }

                # Insert task into MongoDB
                try:
                    result = collection_task.insert_one(task_document)
                    inserted_tasks.append(unique_task_id)
                except Exception as e:
                    print(f"Error inserting task: {e}")

        # Close MongoDB connection
        #

        return {
            "json_data": json_data,
            "inserted_tasks": inserted_tasks
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
        user_input=user_input+"answer in 10-20 words."
        response = llms.invoke(user_input)
        
        return {"response": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


GITHUB_API_URL = "https://api.github.com"

def convert_windows_to_unix_path(windows_path: str):
    """
    Convert a Windows-style file path to a Unix-style file path.
    """
    return windows_path.replace("\\", "/")

def extract_relative_path(full_path: str, base_directory: str):
    """
    Extract the relative path from the full path.
    """
    # Convert both paths to Unix-style
    full_path = convert_windows_to_unix_path(full_path)
    base_directory = convert_windows_to_unix_path(base_directory)
    
    # Remove the base directory from the full path
    if full_path.startswith(base_directory):
        return full_path[len(base_directory):].lstrip("/")
    else:
        return full_path  # Fallback: return the full path if base directory is not found
    
def get_file_metadata_from_mongo(employee_id: str):
    document = collection.find_one({"employeeID": employee_id})
    if not document:
        raise HTTPException(status_code=404, detail="Employee data not found")
    return document["files"]
from submit_task import analyze_task_completion
def get_file_content_from_github(remote_url: str, full_path: str):
    """
    Fetch the content of a file from a GitHub repository.
    """
    try:
        # Parse the GitHub repository owner and name from the remote URL
        parts = remote_url.strip('/').split('/')
        if len(parts) < 2 or "github.com" not in parts:
            raise ValueError("Invalid GitHub remote URL")
        
        repo_owner = parts[-2]
        repo_name = parts[-1].replace(".git", "")
        
        # Extract the relative path
        base_directory = "e:/React/Technova_Closed_Source"  # Replace with your base directory
        relative_path = extract_relative_path(full_path, base_directory)
        
        # Fetch the file content using the GitHub API
        url = f"{GITHUB_API_URL}/repos/{repo_owner}/{repo_name}/contents/{relative_path}"
        response = requests.get(url, headers = {"Authorization" : "Bearer " + os.getenv("GITHUB_TOKEN")})
        print('BOL',os.getenv("GITHUB_TOKEN"))
        prompt="""
create auth token
            """
        score_suggetion=analyze_task_completion(response.json()["content"],prompt)
        # Check for errors
        if response.status_code == 200:
            return score_suggetion
        elif response.status_code == 404:
            print("MAn it didnt work", response.text)
            return None  # File does not exist
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch file content: {response.text}"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_full_changed_files(employee_id: str):
    try:
        # Get file metadata from MongoDB
        files_metadata = get_file_metadata_from_mongo(employee_id)
        
        # Fetch file content from GitHub
        changed_files = []
        for file in files_metadata:
            file_path = file["filePath"]
            remote_url = file["remoteUrl"]
            content = get_file_content_from_github(remote_url, file_path)
         
            changed_files.append({
                "filename": file_path,
                "repo": file["repo"],
                "remote_url": remote_url,
                "changes": file["changes"],
                "content": content
            })
        
        return changed_files
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/get-changed-files")
async def get_changed_files(employee_id: str):
    try:
        return get_full_changed_files(employee_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_meeting_minutes(audio_file_path: str) -> str:
    # Load environment variables from .env file
    load_dotenv()
    import google.generativeai as GenAI
    import pathlib
    
    # Set the Google API key from the environment variable
    os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
    GenAI.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    # Read the audio file as bytes
    audio_bytes = pathlib.Path(audio_file_path).read_bytes()
    
    # Initialize the GenerativeModel with the specified model
    model = GenAI.GenerativeModel('models/gemini-2.0-flash-exp')
    
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
from fastapi import FastAPI, File, UploadFile
@app.post("/generate-minutes/")
async def create_upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".mp3"):
        raise HTTPException(status_code=400, detail="File must be an MP3")
    
    # Save the uploaded file temporarily
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    try:
        # Generate meeting minutes
        minutes = generate_meeting_minutes(file_location)
    finally:
        send_email("taherafsar.work@gmail.com","Meeting Minutes",minutes)
        # Clean up the temporary file
        os.remove(file_location)
    
    return {"minutes": minutes}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)