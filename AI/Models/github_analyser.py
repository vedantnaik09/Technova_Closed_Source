import os
import base64

import requests
from fastapi import HTTPException
from pymongo import MongoClient  # Assuming you're using MongoDB
from dotenv import load_dotenv
load_dotenv(
)

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
        
        # Check for errors
        if response.status_code == 200:
            return base64.b64decode(response.json()["content"]).decode("utf-8")
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