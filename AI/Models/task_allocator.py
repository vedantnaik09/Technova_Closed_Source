import os
import json
from Resume_Analyser import Resume_summarizer  # Ensure this module is correctly imported
import json
import os
import requests
from Deegram import Transcriber
from dotenv import load_dotenv
from google import genai
from anthropic import AnthropicVertex
load_dotenv()
def get_resume(user_ids):
    # Folder path where you want to save the PDFs
    folder_path = r"AI\Models\Resume"

    # Ensure the folder exists, if not create it
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # Iterate over each user ID
    for user_id in user_ids:
        # Construct the PDF URL for the current user
        pdf_url = f"http://172.31.0.36:5000/uploads/resume/{user_id}.pdf"

        # Extract the PDF file name from the URL
        pdf_file_name = os.path.basename(pdf_url)

        # Full path to save the PDF
        pdf_save_path = os.path.join(folder_path, pdf_file_name)

        # Download the PDF
        response = requests.get(pdf_url)

        # Check if the request was successful
        if response.status_code == 200:
            # Save the PDF to the specified folder
            with open(pdf_save_path, 'wb') as pdf_file:
                pdf_file.write(response.content)
            print(f"PDF for user {user_id} successfully saved to {pdf_save_path}")
        else:
            print(f"Failed to download PDF for user {user_id}. Status code: {response.status_code}")

def summarize_resumes(users_id,resume_folder, output_file):
    print("bad", users_id,resume_folder,output_file)
    """
    Summarizes all PDF resumes in the specified folder and saves the results to a JSON file.

    :param resume_folder: Path to the folder containing resume PDFs.
    :param output_file: Path to the output JSON file where summarized results will be saved.
    """
    get_resume(users_id)
    # Initialize a list to store summarized results
    summarized_resumes = []

    # Loop through all files in the resume folder
    for idx, filename in enumerate(os.listdir(resume_folder)):
        if filename.endswith('.pdf'):  # Process only PDF files
            # Construct the full path to the resume
            resume_path = os.path.join(resume_folder, filename)
            
            # Call the Resume_summarizer function
            summary = Resume_summarizer(resume_path)
            os.remove(resume_path)
            
            # Append the result to the list with a sequential number
            summarized_resumes.append({
                'resume_number': users_id[idx],  # Sequential number starting from 1
                'resume_name': filename,   # Name of the resume file
                'summary': summary         # Summarized text
            })

    # Save to JSON file
    with open(output_file, 'w') as f:
        json.dump(summarized_resumes, f, indent=4)

    print(f"Summarized results saved to {output_file}")







def load_json_file(file_path):
    """Load JSON data from a file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def transcribe_audio(file_path):
    """Transcribe audio file to text."""
    return Transcriber(file_path)

def generate_detailed_description(client, model_name, prompt):
    """Generate detailed description using the specified model."""
    response = client.models.generate_content(
        model=model_name,
        contents=[prompt]
    )
    detailed_description = ""
    for part in response.candidates[0].content.parts:
        if not part.thought:
            detailed_description += part.text
    return detailed_description

def create_task_assignments(client, model_name, system_prompt, team_data, task_description):
    """Create task assignments using the specified model."""
    message = client.messages.create(
        model=model_name,
        max_tokens=1054,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"Team Members Data:{team_data} and the Task:{task_description}",
            }
        ],
    )
    return message.content[0].text

def Tasks(audio_file):
    # Paths and configurations
    json_file = r'AI\Models\summarized_resumes.json'
    audio_file = audio_file
    google_credentials = r"AI\Models\trubuddyy-ca64a00f7d15.json"
    reasoning_model = "gemini-2.0-flash-thinking-exp"
    anthropic_model = "claude-3-5-sonnet-v2@20241022"
    region = "us-east5"

    # Load summarized resumes
    summarized_resumes = load_json_file(json_file)

    # Set up Google API key
    os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
    google_client = genai.Client()

    # Transcribe audio
    transcribed_text = transcribe_audio(audio_file)
    print(transcribed_text)

    # Generate detailed description
    prompt = f"""
    You are given Task summary you need to decide the detailed workflow for that task is
    {transcribed_text}
    """
    detailed_description = generate_detailed_description(google_client, reasoning_model, prompt)

    # Set up Anthropic Vertex client
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_credentials
    anthropic_client = AnthropicVertex(project_id="trubuddyy", region=region)

    # System prompt for task assignments
    system_prompt = """
    You are responsible for managing a detailed workflow for a project and assigning tasks to team members based on their expertise. Your goal is to optimize task allocation, ensuring efficiency and alignment with each member's specialization. Additionally, you must set realistic deadlines for each task to ensure timely project completion.

    Instructions:

    1. Analyze the project workflow and break it into specific tasks.
    2. Assign tasks to team members based on their skills and expertise.
    3. Optimize task allocation to balance workloads and maximize productivity.
    4. Set clear deadlines for each task, ensuring the overall project timeline is met.
    5. Provide a summary of task assignments, deadlines, and any dependencies between tasks.

    Output Format:

    Strictly Return the response in the following JSON structure nothing else only json please make sure so that i can directly load the json output:

    {
      "task_assignments": [
        {
          "user_id": "ID of the team member Take that from Team Members Data. ",
          "task_deadline": "Deadline for the task in number of hrs (10hrs)",
          "tasks_summary": "Brief description of the task assigned in List is more than one task [1st,2nd,3rd]",
        }
      ]
    }
    """

    # Create task assignments
    json_string = create_task_assignments(anthropic_client, anthropic_model, system_prompt, summarized_resumes, detailed_description)
    print(json_string)

    # Load the JSON string into a Python dictionary
    json_data = json.loads(json_string)
    return json_data





