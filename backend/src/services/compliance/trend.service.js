import Assessment from "../../models/Assessment.js";

export const getUserComplianceTrends =
  async (userId) => {
    console.log(
  "NEW TREND SERVICE RUNNING"
);
    const assessments =
      await Assessment
        .find({
          userId,
        })
        .sort({
          createdAt: 1,
        });

    const frameworksMap = {};

    assessments.forEach(
      assessment => {

        const framework =
          assessment.framework;

        const documentId =
          assessment.documentId.toString();

        if (
          !frameworksMap[
            framework
          ]
        ) {

          frameworksMap[
            framework
          ] = {

            framework,

            documents: {},

          };

        }

        if (
          !frameworksMap[
            framework
          ].documents[
            documentId
          ]
        ) {

          frameworksMap[
            framework
          ].documents[
            documentId
          ] = [];

        }

        frameworksMap[
          framework
        ].documents[
          documentId
        ].push(
          assessment
        );

      }
    );

    const frameworks =
      Object.values(
        frameworksMap
      ).map(
        frameworkData => {

          const documents =
            Object.entries(
              frameworkData.documents
            ).map(
              ([

                documentId,

                assessments,

              ]) => {

                const firstRisk =
                  assessments[0]
                    .riskScore;

                const latestRisk =
                  assessments[
                    assessments.length -
                    1
                  ].riskScore;

                let trend =
                  "STABLE";

                if (
                  latestRisk <
                  firstRisk
                ) {

                  trend =
                    "IMPROVING";

                } else if (
                  latestRisk >
                  firstRisk
                ) {

                  trend =
                    "DETERIORATING";

                }

                const averageRiskScore =
                  Number(
                    (
                      assessments.reduce(
                        (
                          sum,
                          assessment
                        ) =>
                          sum +
                          assessment.riskScore,
                        0
                      ) /
                      assessments.length
                    ).toFixed(
                      2
                    )
                  );

                return {

                  documentId,

                  assessmentCount:
                    assessments.length,

                  firstRisk,

                  latestRisk,

                  riskChange:
                    latestRisk -
                    firstRisk,

                  averageRiskScore,

                  trend,

                  riskHistory:
                    assessments.map(
                      assessment => ({

                        assessmentId:
                          assessment._id,

                        riskScore:
                          assessment.riskScore,

                        date:
                          assessment.createdAt,

                      })
                    ),

                };

              }
            );

          return {

            framework:
              frameworkData.framework,

            documentCount:
              documents.length,

            documents,

          };

        }
      );

    return frameworks;

};
