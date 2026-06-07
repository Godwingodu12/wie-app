module.exports = {
  apps: [
    // ============================================
    // Auth Service (Port 5000) - MongoDB
    // ============================================
    {
      name: 'wie-auth-service',
      cwd: './services/auth-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        GRPC_PORT: 50051,
        MONGO_URI: 'mongodb://127.0.0.1:27017/authdb',
        JWT_SECRET: 'supersecretkey',
      },
      error_file: './logs/auth-err.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // User/Profile Service (Port 5002) - MongoDB
    // ============================================
    {
      name: 'wie-profile-service',
      cwd: './services/user-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
        JWT_SECRET: 'supersecretkey',
        MONGO_URI: 'mongodb://127.0.0.1:27017/profiledb',
        RABBITMQ_URL: 'amqps://yrdwbvfm:p53hm_GrZl7S3EMJ8q0y_git9g3diZJV@whale.rmq.cloudamqp.com/yrdwbvfm',
      },
      error_file: './logs/profile-err.log',
      out_file: './logs/profile-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // Ticket Service (Port 5003) - PostgreSQL
    // ============================================
    {
      name: 'wie-ticket-service',
      cwd: './services/ticket-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
        GRPC_PORT: 50052,
      },
      error_file: './logs/ticket-err.log',
      out_file: './logs/ticket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // Chat Service (Port 5004) - MongoDB
    // ============================================
    {
      name: 'wie-chat-service',
      cwd: './services/chat-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5004,
        AUTH_GRPC_URL: 'localhost:50051',
        MONGODB_URI: 'mongodb://localhost:27017',
        DB_NAME: 'chat-service',
      },
      error_file: './logs/chat-err.log',
      out_file: './logs/chat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // WIE User Service - Instance 1 (Port 5005) - PRIMARY
    // PostgreSQL + Redis - LOAD BALANCED
    // ============================================
    {
      name: 'wie-user-service-1',
      cwd: './services/wie-user-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5005,
        GRPC_PORT: 50053,
        INSTANCE_ID: 'wie-user-1',
        
        // Database
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'wie-user-auth',
        DB_USER: 'postgres',
        DB_PASSWORD: 'WIE123',
        
        // Redis
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        
        // OTP
        OTP_LIMIT: 3,
        
        // CORS
        CORS_ORIGIN: 'http://localhost:3000',
        
        // JWT
        JWT_SECRET: 'supersecretkey',
      },
      error_file: './logs/user-1-err.log',
      out_file: './logs/user-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // Notification Service (Port 5006) - MongoDB
    // ============================================
    {
      name: 'wie-notification-service',
      cwd: './services/notification-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5006,
        MONGODB_URI: 'mongodb://localhost:27017',
        DB_NAME: 'notification-service',
        JWT_SECRET: 'supersecretkey',
        RABBITMQ_URL: 'amqps://yrdwbvfm:p53hm_GrZl7S3EMJ8q0y_git9g3diZJV@whale.rmq.cloudamqp.com/yrdwbvfm',
        USER_CORS_ORIGIN: 'http://localhost:3000',
        CORS_ORIGIN: 'http://localhost:5173',
      },
      error_file: './logs/notification-err.log',
      out_file: './logs/notification-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // Transaction Service (Port 5007) - PostgreSQL
    // ============================================
    {
      name: 'wie-transaction-service',
      cwd: './services/transaction-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5007,
        GRPC_PORT: 50054,
        TICKET_GRPC_URL: 'localhost:50052',
        WIE_USER_GRPC_URL: 'localhost:50053',
        DATABASE_URL: 'postgresql://postgres:WIE123@localhost:5432/transaction-db?schema=public',
        JWT_SECRET: 'supersecretkey',
      },
      error_file: './logs/transaction-err.log',
      out_file: './logs/transaction-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // WIE User Service - Instance 2 (Port 5008) - BACKUP
    // PostgreSQL + Redis - LOAD BALANCED
    // ============================================
    {
      name: 'wie-user-service-2',
      cwd: './services/wie-user-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5008,
        GRPC_PORT: 50055,
        INSTANCE_ID: 'wie-user-2',
        
        // Database
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'wie-user-auth',
        DB_USER: 'postgres',
        DB_PASSWORD: 'WIE123',
        
        // Redis
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        
        // OTP
        OTP_LIMIT: 3,
        
        // CORS
        CORS_ORIGIN: 'http://localhost:3000',
        
        // JWT
        JWT_SECRET: 'supersecretkey',
      },
      error_file: './logs/user-2-err.log',
      out_file: './logs/user-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // WIE User Service - Instance 3 (Port 5009) - BACKUP
    // PostgreSQL + Redis - LOAD BALANCED
    // ============================================
    {
      name: 'wie-user-service-3',
      cwd: './services/wie-user-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5011,
        GRPC_PORT: 50056,
        INSTANCE_ID: 'wie-user-3',
        
        // Database
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'wie-user-auth',
        DB_USER: 'postgres',
        DB_PASSWORD: 'WIE123',
        
        // Redis
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        
        // OTP
        OTP_LIMIT: 3,
        
        // CORS
        CORS_ORIGIN: 'http://localhost:3000',
        
        // JWT
        JWT_SECRET: 'supersecretkey',
      },
      error_file: './logs/user-3-err.log',
      out_file: './logs/user-3-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },

    // ============================================
    // Follow Service (Port 5009) - MongoDB
    // ============================================
    {
      name: 'wie-follow-service',
      cwd: './services/wie-follow-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5009,
        GRPC_PORT: 50058,
      },
      error_file: './logs/follow-err.log',
      out_file: './logs/follow-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
    },

    // ============================================
    // Media Service (Port 5010) - MongoDB
    // ============================================
    {
      name: 'wie-media-service',
      cwd: './services/wie-media-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5010,
        GRPC_PORT: 50055,
      },
      error_file: './logs/media-err.log',
      out_file: './logs/media-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
    },
  ],
};