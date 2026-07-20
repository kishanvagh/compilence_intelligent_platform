/**
 * ISO/IEC 27001:2022 Annex A Security Controls
 */
export const iso27001Controls = [
  {
    controlId: "A.5.1",
    controlName: "Policies for Information Security",
    description: "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to, and acknowledged by relevant personnel and interested parties.",
    requiredEvidence: [
      "Master Information Security Policy (ISMS)",
      "Employee policy signature logs",
      "Executive management review and approval board minutes"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Organizational Controls", "Governance"]
  },
  {
    controlId: "A.5.8",
    controlName: "Information Classification",
    description: "Information shall be classified in accordance with the information security needs of the organization based on confidentiality, integrity, availability, and relevant legal requirements.",
    requiredEvidence: [
      "Information Classification and Handling Policy",
      "Data classification matrix",
      "Asset labels and repository classification tags"
    ],
    riskLevel: "MEDIUM",
    mappedCategories: ["Organizational Controls", "Data Security"]
  },
  {
    controlId: "A.5.15",
    controlName: "Access Control Policy and Authorization",
    description: "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.",
    requiredEvidence: [
      "Access Control Policy",
      "User access request approvals",
      "Segregation of duties check matrix"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Access Control", "Logical Access"]
  },
  {
    controlId: "A.5.24",
    controlName: "Information Security Incident Management",
    description: "The organization shall plan and prepare for information security incident management by defining processes, roles, responsibilities, reporting paths, and detection mechanisms.",
    requiredEvidence: [
      "Incident Management Policy and Standard Operating Procedures",
      "Incident logging database records",
      "Security team containment training logs"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Incident Management", "Operations"]
  },
  {
    controlId: "A.5.36",
    controlName: "Compliance with Legal, Regulatory, and Contractual Requirements",
    description: "The organization shall identify and document all statutory, regulatory, and contractual requirements relevant to its information systems and security posture.",
    requiredEvidence: [
      "Regulatory compliance register",
      "Customer NDA agreements",
      "Data processing agreements (DPAs)"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Compliance Controls", "Governance"]
  },
  {
    controlId: "A.8.10",
    controlName: "Information Deletion and Secure Disposal",
    description: "Information stored in databases, filesystems, and device storage shall be deleted or securely disposed of when no longer required, in accordance with retention policies.",
    requiredEvidence: [
      "Data Retention and Disposal Policy",
      "Media sanitization certificates",
      "Database cleanup scripts and automation schedules"
    ],
    riskLevel: "MEDIUM",
    mappedCategories: ["Technological Controls", "Data Protection"]
  },
  {
    controlId: "A.8.12",
    controlName: "Data Leakage Prevention (DLP)",
    description: "Data leakage prevention measures shall be applied to systems, networks, and any other devices that process, store, or transmit sensitive information.",
    requiredEvidence: [
      "DLP configuration rules and alert reports",
      "Endpoint monitoring policy settings",
      "USB/removable media block configuration screenshots"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Technological Controls", "Data Protection"]
  },
  {
    controlId: "A.8.15",
    controlName: "Logging and Monitoring Activities",
    description: "Logs recording user activities, security exceptions, faults, and other security-relevant events shall be produced, kept, protected from tampering, and regularly reviewed.",
    requiredEvidence: [
      "Syslog server configuration settings",
      "Audit trail settings demonstrating log integrity controls",
      "Event log review schedules"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Technological Controls", "System Monitoring"]
  },
  {
    controlId: "A.8.20",
    controlName: "Network Security and Segregation",
    description: "Networks and network services shall be managed, secured, and segregated to protect information and systems from unauthorized access or interception.",
    requiredEvidence: [
      "Network routing and firewall topology maps",
      "VLAN segregation configuration settings",
      "Secure VPN/MFA configuration settings"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Technological Controls", "Network Security"]
  },
  {
    controlId: "A.8.24",
    controlName: "Use of Cryptography",
    description: "Rules for the use of cryptography for protection of information shall be defined and implemented, including active cryptographic key management.",
    requiredEvidence: [
      "Cryptographic standards document (e.g. TLS 1.3, AES-256 requirement)",
      "Key Management and HSM configuration logs",
      "Key rotation schedules and procedures"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Technological Controls", "Data Security"]
  }
];