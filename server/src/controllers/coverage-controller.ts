import type {
    Request,
    Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
    CoverageRequirementIdParams,
    UpdateCoverageRequirementBody,
} from "../schemas/schedule-schema.js";
import { updateCoverageRequirement } from "../services/coverage-service.js";

type UpdateCoverageRequirementRequest =
    Request<
        CoverageRequirementIdParams,
        unknown,
        UpdateCoverageRequirementBody
    >;

export async function updateCoverageRequirementController(
    req: UpdateCoverageRequirementRequest,
    res: Response,
): Promise<void> {
    if (!req.auth) {
        throw new AppError(
            401,
            "UNAUTHORIZED",
            "Authentication is required",
        );
    }

    const result =
        await updateCoverageRequirement(
            req.auth.storeId,
            req.params.id,
            req.body.requiredCount,
        );

    res.status(200).json({
        status: "success",
        data: result,
    });
}