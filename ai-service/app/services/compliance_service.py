import time
import re
import json
from app.services.gemini_service import generate_content_with_retry
from app.services.qdrant_service import scroll_chunks

def extract_json(response_text: str):
    """
    Cleans and extracts JSON block from raw LLM responses.
    """
    cleaned = response_text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        # Fallback to regex block extraction
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise Exception(f"Failed to parse JSON from response: {response_text}")

def build_context(retrieved_chunks: list[dict]) -> str:
    """
    Constructs unified context string from retrieved chunks.
    """
    if not retrieved_chunks:
        return ""
    parts = []
    for chunk in retrieved_chunks:
        parts.append(f"\n[Chunk {chunk.get('chunkIndex')} (Page {chunk.get('pageNumber', 1)})]\n\n{chunk.get('text')}\n")
    return "\n\n".join(parts)

def calculate_risk_score(controls: list[dict]) -> int:
    """
    Computes standard risk score metrics.
    """
    score = 0
    for control in controls:
        status = control.get("status")
        if status == "NON_COMPLIANT":
            score += 20
        elif status == "PARTIALLY_COMPLIANT":
            score += 10
    return min(score, 100)

def add_confidence_scores(controls: list[dict]) -> list[dict]:
    """
    Calculates dynamic auditor confidence scores.
    """
    for control in controls:
        source_chunks = control.get("sourceChunks", [])
        confidence = 0.5
        if source_chunks:
            confidence = min(0.5 + (len(source_chunks) * 0.1), 0.95)
        control["confidence"] = round(confidence, 2)
    return controls

def resolve_source_chunks(controls: list[dict], retrieved_chunks: list[dict]) -> list[dict]:
    """
    Maps source reference indices back to full chunk structures.
    """
    for control in controls:
        source_refs = control.get("sourceChunks", [])
        resolved = []
        if not isinstance(source_refs, list):
            source_refs = []
            
        for ref in source_refs:
            index = -1
            if isinstance(ref, (int, float)):
                index = int(ref)
            elif isinstance(ref, str):
                matches = re.search(r"\d+", ref)
                if matches:
                    index = int(matches.group(0))
            
            if index != -1:
                found = next((c for c in retrieved_chunks if c.get("chunkIndex") == index), None)
                if found:
                    resolved.append({
                        "chunkIndex": found.get("chunkIndex"),
                        "pageNumber": found.get("pageNumber", 1),
                        "text": found.get("text")
                    })
                else:
                    if isinstance(ref, str):
                        resolved.append({
                            "chunkIndex": -1,
                            "pageNumber": 1,
                            "text": ref
                        })
        control["sourceChunks"] = resolved
    return controls

def analyze_document_compliance(document_id: str, framework: str, framework_controls: list[dict], fallback_chunks: list[dict] = None) -> dict:
    """
    Runs compliance assessment for a single document.
    """
    retrieved_chunks = scroll_chunks(document_id, limit=20)
    if not retrieved_chunks and fallback_chunks:
        retrieved_chunks = fallback_chunks

    if not retrieved_chunks:
        return {
            "framework": framework,
            "riskScore": 100,
            "compliantControls": 0,
            "partialControls": 0,
            "nonCompliantControls": 0,
            "controls": [],
            "findings": [
                {
                    "title": "No Evidence Found",
                    "severity": "HIGH",
                    "evidence": "Unable to retrieve document content.",
                }
            ],
            "recommendations": ["Upload a valid document."]
        }

    context = build_context(retrieved_chunks)
    prompt = f"""
You are a senior compliance auditor and document classifier.

Evaluate the document evidence against the requested framework controls, perform an applicability check, and generate a gap analysis.

Framework:
{framework}

Controls:
{json.dumps(framework_controls, indent=2)}

Rules for Document Classification & Applicability:
1. Classify the document. Allowed document types: RESUME, SECURITY_POLICY, ACCESS_CONTROL_POLICY, INCIDENT_RESPONSE_POLICY, VENDOR_DOCUMENT, CONTRACT, GENERAL_POLICY, GENERAL_DOCUMENT.
2. Determine if the document is applicable to compliance auditing under the framework {framework}. If it is completely unrelated (e.g., a personal resume, recipe, fictional story, etc.), set assessmentStatus to "NOT_APPLICABLE" and write a clear classification reason.
3. If assessmentStatus is "NOT_APPLICABLE", you can return an empty list of controls.

Rules for Control Evaluation (only if assessmentStatus is "APPLICABLE"):
1. Evaluate the document evidence against EACH control.
2. Allowed control statuses: COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE.
3. Use ONLY evidence from the document. Never invent evidence.
4. If evidence is insufficient, use PARTIALLY_COMPLIANT or NON_COMPLIANT.
5. If the control clearly does not apply to this type of document, use NOT_APPLICABLE.
6. For each control, identify which source chunks support your finding. Reference them by chunk indexes (e.g., ["Chunk 0", "Chunk 1"] or [0, 1]).

Rules for Gap Analysis (only for controls evaluated as PARTIALLY_COMPLIANT or NON_COMPLIANT):
1. Identify the specific gap in the policy document.
2. Highlight the associated businessRisk of not meeting the control.
3. Provide an actionable recommendation to remediate the gap.
For COMPLIANT or NOT_APPLICABLE controls, these fields should be null.

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use code fences.

Response Format:
{{
  "documentType": "",
  "assessmentStatus": "APPLICABLE" or "NOT_APPLICABLE",
  "reason": "",
  "controls": [
    {{
      "controlId": "",
      "controlName": "",
      "status": "",
      "risk": "",
      "evidence": "",
      "sourceChunks": [],
      "gap": null or "...",
      "businessRisk": null or "...",
      "recommendation": null or "..."
    }}
  ]
}}

Document Evidence:
{context}
"""
    response_text = generate_content_with_retry(prompt)
    assessment = extract_json(response_text)
    
    if assessment.get("assessmentStatus") == "NOT_APPLICABLE":
        return {
            "framework": framework,
            "documentType": assessment.get("documentType"),
            "assessmentStatus": "NOT_APPLICABLE",
            "reason": assessment.get("reason"),
            "riskScore": 0,
            "compliantControls": 0,
            "partialControls": 0,
            "nonCompliantControls": 0,
            "notApplicableControls": 0,
            "totalControls": 0,
            "controls": []
        }
        
    resolved = resolve_source_chunks(assessment.get("controls", []), retrieved_chunks)
    controls_with_confidence = add_confidence_scores(resolved)
    risk_score = calculate_risk_score(controls_with_confidence)
    
    compliant = len([c for c in controls_with_confidence if c.get("status") == "COMPLIANT"])
    partial = len([c for c in controls_with_confidence if c.get("status") == "PARTIALLY_COMPLIANT"])
    non_compliant = len([c for c in controls_with_confidence if c.get("status") == "NON_COMPLIANT"])
    not_applicable = len([c for c in controls_with_confidence if c.get("status") == "NOT_APPLICABLE"])
    
    return {
        "framework": framework,
        "documentType": assessment.get("documentType"),
        "assessmentStatus": assessment.get("assessmentStatus"),
        "reason": assessment.get("reason"),
        "riskScore": risk_score,
        "compliantControls": compliant,
        "partialControls": partial,
        "nonCompliantControls": non_compliant,
        "notApplicableControls": not_applicable,
        "totalControls": len(controls_with_confidence),
        "controls": controls_with_confidence
    }

def evaluate_single_control(control: dict, context: str, framework: str, document_name: str) -> dict:
    """
    Evaluates a single framework control against compiled evidence context.
    """
    prompt = f"""
You are a senior compliance auditor. Evaluate the following control against the provided evidence.

Framework: {framework}

Control:
ID: {control.get("controlId")}
Name: {control.get("controlName")}
Description: {control.get("description")}
Risk Level: {control.get("riskLevel", "MEDIUM")}

Evidence Context:
{context}

Instructions:
1. Evaluate if the evidence supports compliance with this control.
2. Status must be one of: COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE
3. Use ONLY evidence from the provided context. Never invent evidence.
4. If evidence is insufficient, use PARTIALLY_COMPLIANT or NON_COMPLIANT.
5. For NON_COMPLIANT or PARTIALLY_COMPLIANT, provide gap analysis with business risk and recommendation.
6. Identify which chunk indexes support your finding.

Return ONLY valid JSON. No markdown. No code fences.

Response Format:
{{
  "controlId": "{control.get("controlId")}",
  "controlName": "{control.get("controlName")}",
  "status": "COMPLIANT",
  "evidence": "Summary of evidence found",
  "sourceChunkIndexes": [0, 1],
  "gap": null or "Description of the gap",
  "businessRisk": null or "Business risk description",
  "recommendation": null or "Actionable recommendation",
  "explanation": "Why this conclusion was reached",
  "limitations": "Any limitations in the evidence"
}}
"""
    response_text = generate_content_with_retry(prompt)
    return extract_json(response_text)

def generate_recommendations(framework: str, failed_controls: list[dict]) -> list[dict]:
    """
    Generates remediation recommendations for failed controls.
    """
    if not failed_controls:
        return []
        
    prompt = f"""
You are a senior GRC consultant. Generate detailed remediation recommendations for the following failed compliance controls.

Framework: {framework}

Failed Controls:
{json.dumps(failed_controls, indent=2)}

For each control, provide:
1. Explanation of why it failed
2. Business impact of non-compliance
3. Recommended fix with specific steps
4. Implementation priority (CRITICAL, HIGH, MEDIUM, LOW)
5. Estimated effort (hours/days/weeks)

Return ONLY valid JSON array. No markdown. No code fences.

Format:
[
  {{
    "controlId": "",
    "controlName": "",
    "explanation": "",
    "businessImpact": "",
    "recommendedFix": "",
    "implementationPriority": "HIGH",
    "estimatedEffort": "2-3 weeks"
  }}
]
"""
    response_text = generate_content_with_retry(prompt)
    return extract_json(response_text)

def analyze_change_impact(old_assessment: dict, new_assessment: dict) -> dict:
    """
    Compares two assessments and generates diff delta metrics.
    """
    old_controls = {c.get("controlId"): c for c in old_assessment.get("controls", [])}
    new_controls = {c.get("controlId"): c for c in new_assessment.get("controls", [])}
    
    new_risks = []
    resolved_risks = []
    changed_controls = []
    removed_evidence = []
    new_evidence = []
    
    for control_id, new_ctrl in new_controls.items():
        old_ctrl = old_controls.get(control_id)
        
        if not old_ctrl:
            new_risks.append(new_ctrl)
            continue
            
        if old_ctrl.get("status") == "COMPLIANT" and new_ctrl.get("status") != "COMPLIANT":
            new_risks.append({**new_ctrl, "regression": True})
            
        if old_ctrl.get("status") != "COMPLIANT" and new_ctrl.get("status") == "COMPLIANT":
            resolved_risks.append({"controlId": control_id, "controlName": new_ctrl.get("controlName")})
            
        if old_ctrl.get("status") != new_ctrl.get("status"):
            changed_controls.append({
                "controlId": control_id,
                "controlName": new_ctrl.get("controlName"),
                "oldStatus": old_ctrl.get("status"),
                "newStatus": new_ctrl.get("status")
            })
            
        old_citations = old_ctrl.get("citations") or []
        new_citations = new_ctrl.get("citations") or []
        old_chunks = {c.get("chunkIndex") for c in old_citations if c.get("chunkIndex") is not None}
        new_chunks = {c.get("chunkIndex") for c in new_citations if c.get("chunkIndex") is not None}
        
        for chunk in old_chunks:
            if chunk not in new_chunks:
                removed_evidence.append({"controlId": control_id, "chunkIndex": chunk})
                
        for chunk in new_chunks:
            if chunk not in old_chunks:
                new_evidence.append({"controlId": control_id, "chunkIndex": chunk})
                
    return {
        "oldRiskScore": old_assessment.get("riskScore", 100),
        "newRiskScore": new_assessment.get("riskScore", 100),
        "riskDelta": new_assessment.get("riskScore", 100) - old_assessment.get("riskScore", 100),
        "newRisks": new_risks,
        "resolvedRisks": resolved_risks,
        "changedControls": changed_controls,
        "removedEvidence": removed_evidence,
        "newEvidence": new_evidence,
        "summary": {
            "newRisksCount": len(new_risks),
            "resolvedRisksCount": len(resolved_risks),
            "changedControlsCount": len(changed_controls),
            "removedEvidenceCount": len(removed_evidence),
            "newEvidenceCount": len(new_evidence)
        }
    }

def classify_document(extracted_text: str, file_name: str = "") -> dict:
    """
    Classifies a document based on text content and name.
    """
    prompt = f"""
You are an expert document classifier. Classify the document with the following metadata:
File Name: {file_name}

Text snippet:
{extracted_text[:2000]}

Allowed classifications:
- RESUME
- SECURITY_POLICY
- ACCESS_CONTROL_POLICY
- INCIDENT_RESPONSE_POLICY
- VENDOR_DOCUMENT
- CONTRACT
- GENERAL_POLICY
- GENERAL_DOCUMENT

Return ONLY valid JSON.

Response Format:
{{
  "documentType": "SECURITY_POLICY",
  "confidence": 0.95,
  "reasoning": "Explanation of why this type was chosen"
}}
"""
    try:
        response_text = generate_content_with_retry(prompt)
        return extract_json(response_text)
    except Exception as e:
        print(f"Classification failed: {e}")
        return {
            "documentType": "GENERAL_DOCUMENT",
            "confidence": 0.5,
            "reasoning": f"Fallback: {e}"
        }

