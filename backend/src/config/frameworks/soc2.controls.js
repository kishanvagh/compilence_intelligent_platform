/**
 * SOC 2 Trust Services Criteria (TSC) Controls
 * Covering Security, Availability, Confidentiality, Processing Integrity, and Privacy
 */
export const soc2Controls = [
  {
    controlId: "CC6.1",
    controlName: "Logical Access Security & Identity Management",
    description: "The organization limits logical access to information assets, infrastructure, and system components to authorized users through secure registration and unique credential assignment.",
    requiredEvidence: [
      "Access Control Policy",
      "User provisioning and deprovisioning records",
      "Evidence of Multi-Factor Authentication (MFA) enforcement"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Logical Access", "Identity Management"]
  },
  {
    controlId: "CC6.2",
    controlName: "Privileged Access Reviews",
    description: "User access rights to systems and data are periodically reviewed and updated based on job roles, the principle of least privilege, and segregation of duties.",
    requiredEvidence: [
      "Quarterly user privilege review reports",
      "Role-based access matrix",
      "Admin credential assignment log"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Logical Access", "Governance"]
  },
  {
    controlId: "CC6.3",
    controlName: "Credential Management & Lifecycle",
    description: "Credentials are encrypted in transit and at rest, and lifecycle activities (revocation, password strength, expiration) are configured and managed according to organizational policy.",
    requiredEvidence: [
      "Active Directory password policy settings",
      "Identity provider configuration screenshots",
      "Revocation logs for terminated employees"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Logical Access", "Data Security"]
  },
  {
    controlId: "CC6.6",
    controlName: "Data Encryption in Transit and at Rest",
    description: "Transmission of data across public networks is protected using strong encryption protocols (TLS 1.2 or higher), and sensitive data is encrypted at rest using AES-256 or equivalent algorithms.",
    requiredEvidence: [
      "SSL/TLS server configuration reports",
      "Database encryption-at-rest settings",
      "Key Management Policy"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Data Protection", "Transmission Security"]
  },
  {
    controlId: "CC6.7",
    controlName: "Transmission and Boundary Controls",
    description: "The organization protects boundaries of systems and environments from unauthorized ingress/egress using firewalls, intrusion detection/prevention systems (IDS/IPS), and network segmentation.",
    requiredEvidence: [
      "Firewall configuration rules",
      "Network architecture diagram showing DMZ and segmentation",
      "Intrusion detection alert logs"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Boundary Defense", "Network Security"]
  },
  {
    controlId: "CC7.1",
    controlName: "Vulnerability Management",
    description: "The organization identifies new security vulnerabilities through regular external and internal vulnerability scans, schedules system patching, and conducts annual independent penetration tests.",
    requiredEvidence: [
      "Vulnerability scan reports",
      "Patch Management Policy",
      "Recent external penetration test report and remediation plan"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Vulnerability Management", "Operations"]
  },
  {
    controlId: "CC7.2",
    controlName: "Security Event Monitoring & Incident Logging",
    description: "Security events and logs from servers, firewalls, and applications are forwarded to a central log management repository (SIEM) and monitored for anomalous activities.",
    requiredEvidence: [
      "SIEM configuration screenshots",
      "Centralized logging policy",
      "Incident response log"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["System Monitoring", "Incident Response"]
  },
  {
    controlId: "CC7.3",
    controlName: "Incident Detection and Response Plan",
    description: "An incident response plan is established, tested annually, and details reporting lines, severity levels, containment, and communication procedures during a breach.",
    requiredEvidence: [
      "Incident Response Plan",
      "Tabletop exercise/incident simulation test report",
      "Breach notification template"
    ],
    riskLevel: "CRITICAL",
    mappedCategories: ["Incident Response", "Business Continuity"]
  },
  {
    controlId: "CC8.1",
    controlName: "System Backups & Disaster Recovery",
    description: "Data backups are configured, encrypted, stored in geographically distinct locations, and tested periodically to ensure organizational operations can recover in the event of an outage.",
    requiredEvidence: [
      "Backup configuration settings",
      "Disaster Recovery (DR) Plan",
      "Recent Backup restoration test log"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Disaster Recovery", "Availability"]
  },
  {
    controlId: "CC8.5",
    controlName: "Software Change Control Process",
    description: "Changes to production systems and applications are authorized, tested in non-production environments, reviewed, and approved prior to deployment, with roll-back plans documented.",
    requiredEvidence: [
      "Change Management Policy",
      "Pull request reviews showing approval checks",
      "Production deployment logs and change authorization tickets"
    ],
    riskLevel: "HIGH",
    mappedCategories: ["Change Management", "Operations"]
  },
  {
    controlId: "CC9.2",
    controlName: "Vendor Risk Assessment",
    description: "Third-party vendors and service providers are evaluated annually to assess their security posture, compliance standards (SOC 2 review), and data handling policies.",
    requiredEvidence: [
      "Vendor Management Policy",
      "Completed vendor security questionnaires",
      "Annual SOC 2 review assessment sheets for critical suppliers"
    ],
    riskLevel: "MEDIUM",
    mappedCategories: ["Vendor Risk", "Third-Party Management"]
  }
];