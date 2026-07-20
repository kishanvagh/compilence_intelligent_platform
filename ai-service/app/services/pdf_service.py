import fitz

def extract_text_from_pdf(pdf_path):
    try:
        print(f"Opening PDF file: {pdf_path}")
        document = fitz.open(pdf_path)
        text = ""
        for page in document:
            text += page.get_text()
        document.close()
        print(f"Successfully extracted {len(text)} characters.")
        return text
    except Exception as e:
        print(f"Error opening or reading PDF file {pdf_path}: {e}")
        raise e

def extract_pages_from_pdf(pdf_path):
    try:
        document = fitz.open(pdf_path)
        pages = []
        for idx, page in enumerate(document):
            pages.append({
                "pageNumber": idx + 1,
                "text": page.get_text()
            })
        document.close()
        return pages
    except Exception as e:
        print(f"Error extracting pages from PDF {pdf_path}: {e}")
        raise e