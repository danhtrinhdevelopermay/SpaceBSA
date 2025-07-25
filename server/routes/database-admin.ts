import { Router } from "express";

const router = Router();

// GET /api/database-admin/status - Get current database status
router.get("/status", async (req, res) => {
  try {
    const { databaseManager } = await import("../database-manager");
    
    // Get current status
    const currentPrimary = (databaseManager as any).currentPrimaryDb;
    const stats = (databaseManager as any).getDatabaseStats();
    
    // Check if auto-switch is enabled (default: true)
    const autoSwitchEnabled = process.env.AUTO_SWITCH_DISABLED !== 'true';
    
    res.json({
      currentPrimary,
      databases: stats,
      autoSwitchEnabled,
      lastAutoSwitch: (databaseManager as any).lastAutoSwitch || null
    });
    
  } catch (error) {
    console.error("[DatabaseAdmin] Error getting status:", error);
    res.status(500).json({ error: "Failed to get database status" });
  }
});

// POST /api/database-admin/switch/:databaseId - Manually switch primary database
router.post("/switch/:databaseId", async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { databaseManager } = await import("../database-manager");
    
    console.log(`[DatabaseAdmin] Manual switch requested to: ${databaseId}`);
    
    // Validate database exists and is healthy
    const stats = (databaseManager as any).getDatabaseStats();
    const targetDb = stats.find((db: any) => db.id === databaseId);
    
    console.log(`[DatabaseAdmin] Target database found:`, JSON.stringify(targetDb, null, 2));
    
    if (!targetDb) {
      return res.status(404).json({ error: "Database not found" });
    }
    
    if (!targetDb.isHealthy) {
      return res.status(400).json({ error: `Target database is not healthy: ${targetDb.name}` });
    }
    
    if (!targetDb.isActive) {
      return res.status(400).json({ error: `Target database is not active: ${targetDb.name}` });
    }
    
    if (targetDb.isPrimary) {
      return res.status(400).json({ error: "Database is already primary" });
    }
    
    console.log(`[DatabaseAdmin] Proceeding with switch to ${databaseId}`);
    
    // Perform manual switch
    const success = await (databaseManager as any).switchToPrimary(databaseId);
    
    if (success) {
      console.log(`[DatabaseAdmin] Successfully switched to: ${databaseId}`);
      res.json({ 
        success: true, 
        message: `Successfully switched to ${databaseId}`,
        currentPrimary: databaseId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "Failed to switch database" 
      });
    }
    
  } catch (error) {
    console.error("[DatabaseAdmin] Error switching database:", error);
    res.status(500).json({ error: "Failed to switch database" });
  }
});

// POST /api/database-admin/auto-switch - Toggle auto-switch functionality
router.post("/auto-switch", async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "Invalid enabled value" });
    }
    
    // Update environment variable (in memory)
    process.env.AUTO_SWITCH_DISABLED = enabled ? 'false' : 'true';
    
    console.log(`[DatabaseAdmin] Auto-switch ${enabled ? 'enabled' : 'disabled'}`);
    
    res.json({
      success: true,
      message: `Auto-switch ${enabled ? 'enabled' : 'disabled'}`,
      autoSwitchEnabled: enabled
    });
    
  } catch (error) {
    console.error("[DatabaseAdmin] Error toggling auto-switch:", error);
    res.status(500).json({ error: "Failed to toggle auto-switch" });
  }
});

// GET /api/database-admin/health - Get detailed health information
router.get("/health", async (req, res) => {
  try {
    const { databaseManager } = await import("../database-manager");
    
    const healthData = await (databaseManager as any).getDetailedHealth();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...healthData
    });
    
  } catch (error) {
    console.error("[DatabaseAdmin] Error getting health data:", error);
    res.status(500).json({ error: "Failed to get health data" });
  }
});

export default router;