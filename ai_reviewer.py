import os
import sys

try:
    from google import genai
except ImportError:
    print("google-genai not found. Please install it using: pip install google-genai")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not found. Please install it using: pip install python-dotenv")
    sys.exit(1)

def read_file(filepath):
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # Truncate if too large to avoid token limits (e.g. 100KB per file)
                if len(content) > 100000:
                    content = content[0:100000] + "\n...[TRUNCATED due to size]..."  # type: ignore
                return content
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return "Report not generated or could not be read."

def generate_report():
    print("Reading security scan reports...")
    gitleaks_report = read_file("gitleaks-report.json")
    semgrep_report = read_file("semgrep-report.json")
    trivy_report = read_file("report.txt")
    dependency_check_report = read_file("target/dependency-check-report.json")
    
    if gitleaks_report == "Report not generated or could not be read." and \
       semgrep_report == "Report not generated or could not be read." and \
       trivy_report == "Report not generated or could not be read." and \
       dependency_check_report == "Report not generated or could not be read.":
       print("No security reports found to analyze.")
       sys.exit(0)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set. Please set it in the .env file.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    prompt = f"""
    You are an expert DevSecOps and Security engineer. Please analyze the following security scan results from four different tools: Gitleaks (Secrets), Semgrep (SAST), Trivy (Container Vulnerabilities), and OWASP Dependency-Check (SCA).
    Provide a unified summary report for the developers. Your report should clearly highlight:
    1. Critical and High severity issues.
    2. A brief analysis of what the vulnerabilities are.
    3. Actionable remediation steps to fix them.
    Format the response nicely in Markdown.
    
    =========== GITLEAKS REPORT ===========
    {gitleaks_report}
    
    =========== SEMGREP REPORT ===========
    {semgrep_report}
    
    =========== TRIVY REPORT ===========
    {trivy_report}
    
    =========== OWASP DEPENDENCY-CHECK REPORT ===========
    {dependency_check_report}
    """
    
    print("Sending reports to Gemini API for analysis...")
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        print("\n--- AI Security Analysis Report ---\n")
        print(response.text)
        print("\n-----------------------------------\n")
        
        # Ensure reports directory exists
        os.makedirs("reports", exist_ok=True)
        
        # Save to file
        with open("reports/ai_security_analysis.md", "w", encoding='utf-8') as f:
            f.write("# AI Security Analysis Report\n\n")
            f.write(response.text)
            print("Report saved to reports/ai_security_analysis.md")
            
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_report()
