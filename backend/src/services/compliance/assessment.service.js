import Assessment from "../../models/Assessment.js";

export const saveAssessment =
  async ({
    userId,
    documentId,
    assessment,
    report,
  }) => {

  const savedAssessment=  await Assessment.create({

  userId,

  documentId,

  framework:
    assessment.framework,

  documentType:
    assessment.documentType,

  assessmentStatus:
    assessment.assessmentStatus,

  reason:
    assessment.reason,

  riskScore:
    assessment.riskScore,

  compliantControls:
    assessment.compliantControls,

  partialControls:
    assessment.partialControls,

  nonCompliantControls:
    assessment.nonCompliantControls,

  notApplicableControls:
    assessment.notApplicableControls,

  totalControls:
    assessment.totalControls,

  controls:
    assessment.controls,

  report,

});
    console.log("Inside saveAssessment");
    console.log(savedAssessment);
    return savedAssessment;

};
