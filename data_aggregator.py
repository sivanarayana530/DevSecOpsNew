import json
import os

def load_json(filepath):
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def normalize_severity(sev):
    sev = str(sev).upper()
    if sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        return sev
    if "CRIT" in sev or "SEV-1" in sev: return "CRITICAL"
    if "HIGH" in sev or "SEV-2" in sev or "ERROR" in sev: return "HIGH"
    if "MED" in sev or "SEV-3" in sev or "WARN" in sev: return "MEDIUM"
    return "LOW"

vulnerabilities = []

# 1. Gitleaks
gl_data = load_json("gitleaks-report.json")
if gl_data:
    for find in gl_data:
        vulnerabilities.append({
            "id": find.get("RuleID", "Secret"),
            "tool": "Gitleaks",
            "severity": "CRITICAL",
            "message": f"Secret exposed: {find.get('Description', '')}",
            "file": find.get("File", "Unknown")
        })

# 2. Semgrep
sg_data = load_json("semgrep-report.json")
if sg_data and "results" in sg_data:
    for find in sg_data["results"]:
        sev = normalize_severity(find.get("extra", {}).get("severity", "LOW"))
        vulnerabilities.append({
            "id": find.get("check_id", "Semgrep Rule"),
            "tool": "Semgrep",
            "severity": sev,
            "message": find.get("extra", {}).get("message", "SAST Finding"),
            "file": find.get("path", "Unknown")
        })

# 3. OWASP Dependency Check
odc_data = load_json("target/dependency-check-report.json")
if odc_data and "dependencies" in odc_data:
    for dep in odc_data["dependencies"]:
        if "vulnerabilities" in dep:
            for vuln in dep["vulnerabilities"]:
                sev = normalize_severity(vuln.get("severity", "LOW"))
                if "cvssv3" in vuln:
                    sev = normalize_severity(vuln["cvssv3"].get("baseSeverity", sev))
                vulnerabilities.append({
                    "id": vuln.get("name", "CVE Unknown"),
                    "tool": "OWASP",
                    "severity": sev,
                    "message": vuln.get("description", "Vulnerable Dependency"),
                    "file": dep.get("fileName", "Unknown")
                })

# 4. Trivy
trivy_data = load_json("trivy-report.json")
if trivy_data and "Results" in trivy_data:
    for res in trivy_data["Results"]:
        if "Vulnerabilities" in res:
            for vuln in res["Vulnerabilities"]:
                sev = normalize_severity(vuln.get("Severity", "LOW"))
                vulnerabilities.append({
                    "id": vuln.get("VulnerabilityID", "CVE Unknown"),
                    "tool": "Trivy",
                    "severity": sev,
                    "message": vuln.get("Title", vuln.get("Description", "Container Vuln")),
                    "file": res.get("Target", "Image")
                })

summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0,"UNKNOWN":0}
tools = {"Gitleaks": 0, "Semgrep": 0, "OWASP": 0, "Trivy": 0}

for v in vulnerabilities:
    s = v["severity"]
    if s in summary: summary[s] += 1
    else: summary["UNKNOWN"] += 1
    
    t = v["tool"]
    if t in tools: tools[t] += 1
    else: tools[t] = 1

os.makedirs("reports", exist_ok=True)
with open("reports/security-data.json", "w", encoding="utf-8") as f:
    json.dump({
        "summary": summary,
        "tools": tools,
        "vulnerabilities": vulnerabilities
    }, f, indent=2)

print("✅ Unified security data aggregated to reports/security-data.json")
