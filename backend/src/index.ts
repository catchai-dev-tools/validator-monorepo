import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './data-source';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';
import { UserService } from './services/UserService';
import { UserRole } from './entities/User';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve it statically
const uploadDir = process.env.UPLOAD_PATH || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Swagger/OpenAPI setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Data Validation API',
      version: '1.0.0',
      description: 'OpenAPI documentation for the Data Validation API',
    },
    servers: [
      { url: `http://localhost:${PORT}` },
    ],
  },
  // Look for JSDoc @openapi annotations in route files
  apis: ['src/routes/**/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI and raw spec
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function bootstrap() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    
    // Seed default admin user on first run
    try {
      const userService = new UserService();
      const existingUsers = await userService.getAllUsers();
      if (!existingUsers || existingUsers.length === 0) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
          console.warn('[SEED] No users found, but ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin seed.');
        } else {
          await userService.createUser({
            email: adminEmail,
            password: adminPassword,
            role: UserRole.ADMIN,
          });
          console.log(`[SEED] Created default admin user: ${adminEmail}`);
        }
      }
    } catch (seedErr) {
      console.warn('[SEED] Failed to seed default admin:', seedErr);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API endpoints: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

bootstrap();
