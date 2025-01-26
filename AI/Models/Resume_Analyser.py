import PyPDF2
import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF file
    
    Args:
        pdf_path (str): Path to the PDF file
    
    Returns:
        str: Extracted text from the PDF
    """
    try:
        logger.info(f"Attempting to extract text from PDF: {pdf_path}")
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                logger.debug(f"Extracted text from page {page_num}: {len(page_text)} characters")
                text += page_text
            
            logger.info(f"Successfully extracted text. Total length: {len(text)} characters")
            return text
    except FileNotFoundError:
        logger.error(f"PDF file not found: {pdf_path}")
        raise
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise

def summarize_text(text):
    """
    Summarize the text using Google Generative AI
    
    Args:
        text (str): Input text to summarize
    
    Returns:
        str: Summarized text
    """
    try:
        logger.info("Initializing GoogleGenAI model")
        genai = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
        
        messages = [
            (
                "system",
                "You are need to provide the summary of the resume like which tech skill that person and summarize in 20-30 words and choose only field in which he is strong as his resume may have all the fields. I need only tech stack specific.",
            ),
            ("human", f"{text}"),
        ]
        
        logger.info(f"Sending text for summarization. Input length: {len(text)} characters")
        response = genai.invoke(messages)
        
        logger.info(f"Received summary. Length: {len(response.content)} characters")
        return response.content
    except Exception as e:
        logger.error(f"Error during text summarization: {e}")
        raise

def Resume_summarizer(pdf_path):
    """
    Main function to extract and summarize resume text
    
    Args:
        pdf_path (str): Path to the resume PDF
    
    Returns:
        str: Summarized resume text
    """
    try:
        logger.info(f"Starting resume summarization for: {pdf_path}")
        
        # Step 1: Extract text from the PDF
        text = extract_text_from_pdf(pdf_path)
        
        # Step 2: Summarize the extracted text
        summary = summarize_text(text)
        
        logger.info("Resume summarization completed successfully")
        return summary
    
    except Exception as e:
        logger.error(f"Resume summarization failed: {e}")
        return None

