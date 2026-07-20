import {
  getUserComplianceTrends,
}
from "../services/compliance/trend.service.js";

export const getTrendDashboard =
  async (
    req,
    res
  ) => {

    try {

      const trends =
        await getUserComplianceTrends(
          req.user._id
        );

      return res.status(200).json({

        success: true,

        frameworks:
          trends,

      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

};