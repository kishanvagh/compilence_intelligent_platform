/**
 * GDPR (General Data Protection Regulation) Compliance Controls
 */
export const gdprControls = [
  {
    controlId: "ART-5",
    controlName: "Principles of Data Processing",
    description: "Personal data shall be processed lawfully, fairly, and transparently, limited to specified and legitimate purposes, minimized to what is necessary, kept accurate, and retained only as long as required.",
    requiredEvidence: [
      "Privacy Policy / Notice",
      "Lawful basis for processing assessment document",
      "Data retention schedule"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Data Protection", "Principles"]
  },
  {
    controlId: "ART-13",
    controlName: "Data Subject Information & Transparency",
    description: "The organization must provide data subjects with transparent, clear information about who is collecting their data, why, and how they can exercise their rights.",
    requiredEvidence: [
      "Public-facing Website Privacy Notice",
      "Consent collection checkbox and log mechanics",
      "DPO contact information accessibility"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Data Subject Rights", "Transparency"]
  },
  {
    controlId: "ART-15",
    controlName: "Data Subject Access Request (DSAR) Process",
    description: "Processes must be established to allow data subjects to access, rectify, restrict, object to, export, or erase (Right to be Forgotten) their personal data upon request without undue delay.",
    requiredEvidence: [
      "DSAR handling procedure document",
      "DSAR portal/submission form URL",
      "Historical logs of completed DSAR actions"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Data Subject Rights", "Operations"]
  },
  {
    controlId: "ART-25",
    controlName: "Privacy by Design and by Default",
    description: "The organization must implement technical and organizational measures (such as pseudonymization) designed to integrate data protection safeguards into processing activities by default.",
    requiredEvidence: [
      "Secure software development lifecycle (SSDLC) policy containing privacy checks",
      "Pseudonymization and anonymization standards",
      "Default database configuration sheets"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Privacy Engineering", "System Design"]
  },
  {
    controlId: "ART-30",
    controlName: "Record of Processing Activities (ROPA)",
    description: "The organization must maintain a detailed written record of processing activities under its responsibility, including purposes of processing, data categories, recipients, and retention periods.",
    requiredEvidence: [
      "Record of Processing Activities (ROPA) spreadsheet/register",
      "Data flow map showing personal data lifecycle",
      "Data Inventory list"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Governance", "Documentation"]
  },
  {
    controlId: "ART-32",
    controlName: "Security of Data Processing",
    description: "The controller and processor shall implement appropriate technical and organizational measures (encryption, pseudonymization, continuous availability, security testing) to ensure data confidentiality and integrity.",
    requiredEvidence: [
      "Technical Security policy",
      "TLS/encryption configuration files",
      "Incident and backup test logs"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Data Security", "Technological Controls"]
  },
  {
    controlId: "ART-33",
    controlName: "Data Breach Notification (Supervisory Authority)",
    description: "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the competent supervisory authority.",
    requiredEvidence: [
      "Data Breach Notification Policy",
      "Breach notification template/draft form",
      "Supervisory authority contact list"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Incident Response", "Compliance"]
  },
  {
    controlId: "ART-35",
    controlName: "Data Protection Impact Assessment (DPIA)",
    description: "Where processing is likely to result in a high risk to the rights and freedoms of individuals, the organization must carry out a prior assessment of the impact of the processing operations.",
    requiredEvidence: [
      "DPIA policy and methodology document",
      "Completed DPIA reports for high-risk operations",
      "Risk assessment register"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Governance", "Risk Assessment"]
  },
  {
    controlId: "ART-37",
    controlName: "Designation of Data Protection Officer (DPO)",
    description: "The organization shall designate a Data Protection Officer (DPO) in cases where processing is carried out by a public authority or core activities require regular and systematic monitoring on a large scale.",
    requiredEvidence: [
      "DPO appointment letter",
      "DPO job description and reporting line structure",
      "DPO publication on website/regulatory filings"
    ],
    riskLevel: "MEDIUM",
    mappedCategories: ["Governance", "Organizational Controls"]
  }
];