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

@app.get('/get-chart')
async def get_chart(userid: str):
    """
    Endpoint to generate time series plot of total changes and first-order differences,
    returning both as base64 encoded images.
    """
    try:
        # Get records from MongoDB
        records = collection.find({"employeeID": userid})
        data_list = list(records)

        if not data_list:
            return {"message": "No data found"}

        # Extract and process data
        timestamps = []
        total_changes = []
        
        for record in data_list:
            timestamps.append(datetime.fromisoformat(record['timestamp']))
            total_changes.append(record['totalChanges'])

        # Sort data chronologically
        sorted_data = sorted(zip(timestamps, total_changes), key=lambda x: x[0])
        dates = [item[0] for item in sorted_data]
        changes = [item[1] for item in sorted_data]

        # Generate plot for total changes
        plt.figure(figsize=(12, 6))
        plt.plot(dates, changes, marker='o', linestyle='-', color='b')
        plt.title(f'Time Series of Total Changes (Employee {userid})')
        plt.xlabel('Timestamp')
        plt.ylabel('Total Changes')
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()

        # Show the plot for debugging
        #plt.show()

        # Save plot to bytes buffer
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        plt.close()
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')

        # Prepare variables for differences plot
        img_diff_base64 = None
        error_message = None

        # Check if there are enough data points for differences
        if len(changes) >= 2:
            # Compute first-order differences
            differences = [changes[i] - changes[i-1] for i in range(1, len(changes))]
            diff_dates = dates[1:]  # dates correspond to differences

            # Generate plot for differences
            plt.figure(figsize=(12, 6))
            plt.plot(diff_dates, differences, marker='o', linestyle='-', color='r')
            plt.title(f'First-Order Differences (Employee {userid})')
            plt.xlabel('Timestamp')
            plt.ylabel('Change Difference')
            plt.grid(True)
            plt.xticks(rotation=45)
            plt.tight_layout()

            # Show the differences plot for debugging
            #plt.show()

            # Save differences plot to bytes buffer
            buf_diff = BytesIO()
            plt.savefig(buf_diff, format='png', dpi=100)
            plt.close()
            buf_diff.seek(0)
            img_diff_base64 = base64.b64encode(buf_diff.read()).decode('utf-8')
        else:
            error_message = "Insufficient data points to calculate differences"

        # Prepare response data
        response_data = {
            "total_changes_image": img_base64,
            "differences_image": img_diff_base64
        }
        if error_message:
            response_data["difference_error"] = error_message

        return JSONResponse(content=response_data)
    
    except Exception as e:
        return {"error": str(e)}
    
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

        # Process resumes and generate tasks
        resume_folder = r'AI\Models\resume'
        output_file = r'AI\Models\summarized_resumes.json'
        summarize_resumes(users_id, resume_folder, output_file)
        
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
        response = llms.invoke(user_input)
        
        return {"response": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)