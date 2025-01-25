import PyPDF2
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")
def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
        return text

def summarize_text(text):
    # Initialize the GoogleGenAI model
    genai =ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
    messages = [
    (
        "system",
        "You are need to provide the summary of the resume like which tech skill that person and summarize in 20-30 words and choose only field in which he is strong as his resume may have all the fields.I need only tech stack specific.",
    ),
    ("human", f"{text}"),
]
    
    # Generate a summary
    response=genai.invoke(messages)
    return response.content

def Resume_summarizer(pdf_path):
    # Step 1: Extract text from the PDF
    text = extract_text_from_pdf(pdf_path)
    
    # Step 2: Summarize the extracted text
    summary = summarize_text(text)
    
    return summary

# Example usage
pdf_path = r'AI\Models\Resume (1).pdf'

# summary = Resume_summarizer(pdf_path)
# print(summary)