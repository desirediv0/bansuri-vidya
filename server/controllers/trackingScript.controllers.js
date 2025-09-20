import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Admin: Get all tracking scripts
export const getAllTrackingScripts = asyncHandler(async (req, res) => {
    const scripts = await prisma.trackingScript.findMany({
        orderBy: [
            { priority: "desc" },
            { createdAt: "desc" }
        ]
    });

    return res.status(200).json(
        new ApiResponsive(200, scripts, "Tracking scripts fetched successfully")
    );
});

// Admin: Get tracking script by ID
export const getTrackingScriptById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const script = await prisma.trackingScript.findUnique({
        where: { id }
    });

    if (!script) {
        throw new ApiError(404, "Tracking script not found");
    }

    return res.status(200).json(
        new ApiResponsive(200, script, "Tracking script fetched successfully")
    );
});

// Admin: Create new tracking script
export const createTrackingScript = asyncHandler(async (req, res) => {
    const { name, description, script, isActive, position, priority } = req.body;

    // Validate required fields
    if (!name || (typeof name === 'string' && name.trim() === "")) {
        throw new ApiError(400, "Name is required and cannot be empty");
    }

    if (!script || (typeof script === 'string' && script.trim() === "")) {
        throw new ApiError(400, "Script content is required and cannot be empty");
    }

    // Validate position if provided
    const validPositions = ['HEAD', 'BODY_START', 'BODY_END'];
    if (position && !validPositions.includes(position)) {
        throw new ApiError(400, "Invalid position. Must be one of: HEAD, BODY_START, BODY_END");
    }

    try {
        const newScript = await prisma.trackingScript.create({
            data: {
                name: typeof name === 'string' ? name.trim() : name,
                description: description || null,
                script: typeof script === 'string' ? script.trim() : script,
                isActive: isActive !== undefined ? isActive : true,
                position: position || "HEAD",
                priority: parseInt(priority) || 0
            }
        });

        return res.status(201).json(
            new ApiResponsive(201, newScript, "Tracking script created successfully")
        );
    } catch (error) {
        console.error("Database error:", error);
        throw new ApiError(500, "Failed to create tracking script");
    }
});

// Admin: Update tracking script
export const updateTrackingScript = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, script, isActive, position, priority } = req.body;

    const existingScript = await prisma.trackingScript.findUnique({
        where: { id }
    });

    if (!existingScript) {
        throw new ApiError(404, "Tracking script not found");
    }

    const updatedScript = await prisma.trackingScript.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(script && { script }),
            ...(isActive !== undefined && { isActive }),
            ...(position && { position }),
            ...(priority !== undefined && { priority })
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, updatedScript, "Tracking script updated successfully")
    );
});

// Admin: Delete tracking script
export const deleteTrackingScript = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingScript = await prisma.trackingScript.findUnique({
        where: { id }
    });

    if (!existingScript) {
        throw new ApiError(404, "Tracking script not found");
    }

    await prisma.trackingScript.delete({
        where: { id }
    });

    return res.status(200).json(
        new ApiResponsive(200, null, "Tracking script deleted successfully")
    );
});

// Admin: Toggle tracking script status
export const toggleTrackingScript = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingScript = await prisma.trackingScript.findUnique({
        where: { id }
    });

    if (!existingScript) {
        throw new ApiError(404, "Tracking script not found");
    }

    const updatedScript = await prisma.trackingScript.update({
        where: { id },
        data: {
            isActive: !existingScript.isActive
        }
    });

    return res.status(200).json(
        new ApiResponsive(
            200,
            updatedScript,
            `Tracking script ${updatedScript.isActive ? 'activated' : 'deactivated'} successfully`
        )
    );
});

// Public: Get active tracking scripts for frontend
export const getActiveTrackingScripts = asyncHandler(async (req, res) => {
    const { position } = req.query;

    const whereClause = {
        isActive: true,
        ...(position && { position })
    }; const scripts = await prisma.trackingScript.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            script: true,
            position: true,
            priority: true,
            isActive: true
        },
        orderBy: [
            { priority: "desc" },
            { createdAt: "asc" }
        ]
    });

    return res.status(200).json(
        new ApiResponsive(200, scripts, "Active tracking scripts fetched successfully")
    );
});

// Admin: Bulk update script priorities
export const updateScriptPriorities = asyncHandler(async (req, res) => {
    const { scripts } = req.body; // Array of { id, priority }

    if (!scripts || !Array.isArray(scripts)) {
        throw new ApiError(400, "Scripts array is required");
    }

    const updatePromises = scripts.map(({ id, priority }) =>
        prisma.trackingScript.update({
            where: { id },
            data: { priority }
        })
    );

    await Promise.all(updatePromises);

    return res.status(200).json(
        new ApiResponsive(200, null, "Script priorities updated successfully")
    );
});

// Error reporting endpoint for tracking script issues
export const reportScriptError = asyncHandler(async (req, res) => {
    const { scriptId, scriptName, error, stack, url, userAgent, timestamp } = req.body;

    // Log the error for immediate visibility
    console.error(`🚨 Tracking Script Error Report:`, {
        scriptId,
        scriptName,
        error,
        url,
        timestamp,
        userAgent: userAgent?.substring(0, 100) // Truncate user agent
    });

    // Store in database for admin dashboard (optional - requires error table)
    try {
        // You can create a TrackingScriptError model in Prisma schema if needed
        // For now, just log and acknowledge
        console.log(`📋 Error logged for script: ${scriptName} (${scriptId})`);
    } catch (dbError) {
        console.error('Failed to store error in database:', dbError);
    }

    return res.status(200).json(
        new ApiResponsive(200, { received: true }, "Error report received")
    );
});

// Health check endpoint for script monitoring
export const getScriptHealth = asyncHandler(async (req, res) => {
    try {
        // Get all active scripts
        const activeScripts = await prisma.trackingScript.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                script: true,
                position: true
            }
        });

        // Basic validation for common script issues
        const errors = [];

        activeScripts.forEach(script => {
            const scriptContent = script.script;

            // Check for potential HTML parsing issues
            if (scriptContent.includes('<script') && scriptContent.includes('</script>')) {
                errors.push({
                    scriptId: script.id,
                    scriptName: script.name,
                    message: 'Script contains HTML tags that may cause parsing errors'
                });
            }

            // Check for syntax that might cause insertBefore issues
            if (scriptContent.includes('<') && !scriptContent.trim().startsWith('(function')) {
                errors.push({
                    scriptId: script.id,
                    scriptName: script.name,
                    message: 'Script contains angle brackets that may cause DOM insertion errors'
                });
            }

            // Check for missing semicolons or malformed code
            if (!scriptContent.trim().endsWith(';') && !scriptContent.trim().endsWith('}')) {
                errors.push({
                    scriptId: script.id,
                    scriptName: script.name,
                    message: 'Script may have incomplete syntax (missing semicolon or closing brace)'
                });
            }
        });

        return res.status(200).json(
            new ApiResponsive(200, {
                totalScripts: activeScripts.length,
                errors: errors,
                lastChecked: new Date().toISOString()
            }, "Script health check completed")
        );

    } catch (error) {
        throw new ApiError(500, "Failed to perform health check");
    }
});
