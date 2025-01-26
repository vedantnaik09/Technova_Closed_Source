from google import genai
import json
from dotenv import load_dotenv
load_dotenv()
import os
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
gcp_client = genai.Client(api_key=GOOGLE_API_KEY)

def analyze_task_completion(file_content, prompt):
    """
    Analyzes the task completion percentage and remaining parts based on the given file content and prompt.
    
    Args:
        file_content (str): The content of the code file to analyze.
        prompt (str): The task prompt given to the user.
    
    Returns:
        dict: A dictionary containing the completion percentage and remaining parts of the task.
    """
    # Prepare the input for the model
    input_text = f"""You are given code file content: {file_content}. 
    Analyze the file and see the task that was given to the user: {prompt}. 
    Reply directly in percentage "xyz%" and what parts of the task are remaining. 
    Reply in one JSON only."""

    # Generate content using the model
    response = gcp_client.models.generate_content(
        model='gemini-2.0-flash-thinking-exp',
        contents=input_text,
    )

    # Extract the model's response
    model_response = ""
    for part in response.candidates[0].content.parts:
        if part.thought:
            print(f"Model Thought:\n{part.text}\n")
        else:
            model_response += part.text

    # Parse the model's response into a dictionary
    

    return model_response
