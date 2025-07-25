import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { wsManager } from "./websocket";
import { keepAliveService } from "./keepalive";
import { cronJobService } from "./cron-job";
import { databaseMonitor } from "./database-monitor";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Initialize WebSocket server (disabled in development)
  if (process.env.NODE_ENV === 'production') {
    wsManager.init(server);
  }
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start enhanced cron job service for database maintenance
    setTimeout(async () => {
      try {
        await cronJobService.start();
        log('Cron job service started successfully');
      } catch (error) {
        console.error('Failed to start cron job service:', error);
      }
    }, 5000); // Wait 5 seconds after startup

    // Start keep-alive service to prevent spin-down and maintain database connection
    setTimeout(async () => {
      try {
        await keepAliveService.start();
        log('Keep-alive service started successfully');
      } catch (error) {
        console.error('Failed to start keep-alive service:', error);
      }
    }, 10000); // Wait 10 seconds after startup for everything to initialize

    // Start database monitoring service for comprehensive health tracking
    setTimeout(async () => {
      try {
        await databaseMonitor.start();
        log('Database monitor started successfully');
      } catch (error) {
        console.error('Failed to start database monitor:', error);
      }
    }, 15000); // Wait 15 seconds after startup for all other services to initialize
  });
})();
