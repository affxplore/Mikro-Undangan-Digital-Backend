/**
 * ================================================================================
 * MIKRO UNDANGAN - RESPONSE HELPER
 * ================================================================================
 * 
 * Standardized API response format with backward compatibility
 * 
 * NEW FORMAT (Clean & Simple - Recommended):
 * -------------------------------------------
 * successResponse(res, 200, "User created successfully", userData)
 * successResponse(res, 200, "Users retrieved", userList, pagination)
 * errorResponse(res, 404, "User not found")
 * errorResponse(res, 400, "Validation failed", validationErrors)
 * 
 * Response Structure (NEW):
 * {
 *   "success": true,
 *   "message": "Success message",
 *   "data": { ... },
 *   "pagination": { ... } // optional
 * }
 * 
 * OLD FORMAT (Backward Compatible - Legacy):
 * ------------------------------------------
 * successResponse(res, 200, "success", "Message", false, null, data)
 * errorResponse(res, 404, "error", "Message", false, null, null)
 * 
 * Response Structure (OLD):
 * {
 *   "meta": {
 *     "code": 200,
 *     "status": "success",
 *     "message": "...",
 *     "isPaginated": false
 *   },
 *   "data": { ... }
 * }
 * ================================================================================
 */

/**
 * ✅ IMPROVED - Success Response Helper
 * Supports both OLD format (7 params) and NEW format (3-4 params)
 * 
 * NEW FORMAT (Recommended):
 * successResponse(res, statusCode, message, data, pagination?)
 * 
 * OLD FORMAT (Backward Compatible):
 * successResponse(res, metaCode, metaStatus, metaMsg, isPaginated, pagination, payload)
 */
export function successResponse(res, statusCode = 200, messageOrStatus, dataOrMessage, paginationOrIsPaginated, paginationOld, payloadOld) {
    let finalStatusCode, finalMessage, finalData, finalPagination;

    // Detect OLD format (7 params): check if 4th param is boolean (isPaginated)
    if (typeof paginationOrIsPaginated === 'boolean') {
        // OLD FORMAT
        finalStatusCode = statusCode;
        finalMessage = dataOrMessage;
        finalData = payloadOld;
        finalPagination = paginationOld;
        
        // Build OLD response structure for backward compatibility
        const response = {
            meta: {
                code: finalStatusCode,
                status: messageOrStatus,
                message: finalMessage,
                isPaginated: paginationOrIsPaginated
            },
            data: finalData
        };
        
        // Only add pagination if not null
        if (finalPagination) {
            response.pagination = finalPagination;
        }
        
        return res.status(finalStatusCode).json(response);
    }

    // NEW FORMAT (3-4 params)
    finalStatusCode = statusCode;
    finalMessage = messageOrStatus;
    finalData = dataOrMessage;
    finalPagination = paginationOrIsPaginated;

    const response = {
        success: true,
        message: finalMessage,
        data: finalData
    };

    // Only add pagination if provided
    if (finalPagination) {
        response.pagination = finalPagination;
    }

    return res.status(finalStatusCode).json(response);
}

/**
 * ✅ IMPROVED - Error Response Helper
 * Supports both OLD format (7 params) and NEW format (3-4 params)
 * 
 * NEW FORMAT (Recommended):
 * errorResponse(res, statusCode, message, errors?)
 * 
 * OLD FORMAT (Backward Compatible):
 * errorResponse(res, metaCode, metaStatus, metaMsg, isPaginated, pagination, payload)
 */
export function errorResponse(res, statusCode = 400, messageOrStatus, errorsOrMessage, isPaginatedOld, paginationOld, payloadOld) {
    let finalStatusCode, finalMessage, finalErrors;

    // Detect OLD format (7 params): check if 5th param is boolean
    if (typeof isPaginatedOld === 'boolean') {
        // OLD FORMAT
        finalStatusCode = statusCode;
        finalMessage = errorsOrMessage;
        finalErrors = payloadOld;
        
        // Build OLD response structure
        const response = {
            meta: {
                code: finalStatusCode,
                status: messageOrStatus,
                message: finalMessage,
                isPaginated: isPaginatedOld
            },
            data: finalErrors
        };
        
        if (paginationOld) {
            response.pagination = paginationOld;
        }
        
        return res.status(finalStatusCode).json(response);
    }

    // NEW FORMAT (3-4 params)
    finalStatusCode = statusCode;
    finalMessage = messageOrStatus;
    finalErrors = errorsOrMessage;

    const response = {
        success: false,
        message: finalMessage
    };

    // Only add errors if provided
    if (finalErrors) {
        response.errors = finalErrors;
    }

    return res.status(finalStatusCode).json(response);
}