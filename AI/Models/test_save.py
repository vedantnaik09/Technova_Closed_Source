import json
import os
import uuid
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()
# Path to the JSON file
json_file_path = r"AI\Models\sample_output.json"

# Get MongoDB connection URL from environment variable
db_url = os.getenv("MONGODB_URI")
print("The database URL is:", db_url)

# Connect to MongoDB
client = MongoClient(db_url)
db = client["test"]  # Replace with your database name
collection = db["tasks"]  # Replace with your collection name

# Load the JSON data from the file
with open(json_file_path, "r") as file:
    data = json.load(file)

task_assignments = data.get("task_assignments", [])
import uuid
import uuid

# Iterate through the task assignments
for assignment in task_assignments:
    user_id = assignment.get("user_id")
    task_deadline = assignment.get("task_deadline")  # e.g., "10hr" or "30hrs"
    tasks_summary = assignment.get("tasks_summary", [])

    # Extract the numeric value from the task_deadline string (e.g., "10hr" -> 10 or "30hrs" -> 30)
    try:
        # Remove both "hr" and "hrs" and convert to integer
        deadline_hours = int(task_deadline.replace("hrs", "").replace("hr", "").strip())
    except ValueError:
        print(f"Invalid task_deadline format: {task_deadline}")
        continue  # Skip this assignment if the deadline format is invalid

    # Create a task document for each task summary
    num = len(tasks_summary)
    for i, task_summary in enumerate(tasks_summary):
        # Generate a unique task ID
        unique_task_id = str(uuid.uuid4())

        # Calculate estimated hours per task
        estimated_hours = deadline_hours // num

        # Create task document
        task_document = {
            "_id": unique_task_id,  # Use UUID as the unique identifier
            "assignedTo": user_id,
            "description": task_summary,
            "estimatedHours": estimated_hours,  # Store only the numeric value
            "status": "TODO",
            "priority": i + 1,
            "aiMetadata": "ai",
            "title": "status",
            "project_id": "sample_id"
        }

        # Insert the task document into MongoDB
        try:
            result = collection.insert_one(task_document)
            print(f"Inserted task with ID: {unique_task_id}")
        except Exception as e:
            print(f"Error inserting task: {e}")