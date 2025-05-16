import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../shared/schema";

export async function main() {
  console.log("Starting database schema push...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  
  // Create a separate connection for migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    // Push the schema to the database
    console.log("Pushing schema to database...");
    
    // Create the tables
    console.log("Creating tables...");
    
    // Create user role enum
    await migrationClient`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
              CREATE TYPE user_role AS ENUM ('doctor', 'patient');
          END IF;
      END
      $$;
    `;
    
    // Create file status enum
    await migrationClient`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_status') THEN
              CREATE TYPE file_status AS ENUM ('uploaded', 'analyzed');
          END IF;
      END
      $$;
    `;
    
    // Create message status enum
    await migrationClient`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
              CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
          END IF;
      END
      $$;
    `;
    
    // Create users table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        specialization VARCHAR(255),
        profile_picture TEXT,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create medical_files table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS medical_files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        file_name VARCHAR(255) NOT NULL,
        file_content TEXT NOT NULL,
        file_type VARCHAR(255) NOT NULL,
        status file_status NOT NULL DEFAULT 'uploaded',
        upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create predictions table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        file_id INTEGER REFERENCES medical_files(id),
        prediction_data JSONB NOT NULL,
        result BOOLEAN NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create conversations table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES users(id),
        patient_id INTEGER NOT NULL REFERENCES users(id),
        last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(doctor_id, patient_id)
      );
    `;
    
    // Create messages table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id),
        from_user_id INTEGER NOT NULL REFERENCES users(id),
        to_user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        status message_status NOT NULL DEFAULT 'sent',
        sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create health_metrics table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS health_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        metric_type VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    console.log("All tables created successfully!");
    
    // Add test data
    console.log("Adding initial test data...");
    
    // Check if we already have users
    const existingUsers = await migrationClient`SELECT COUNT(*) FROM users`;
    if (parseInt(existingUsers[0].count) === 0) {
      console.log("Adding test users...");
      
      // Add a doctor
      await migrationClient`
        INSERT INTO users (username, password, email, full_name, role, specialization, bio, profile_picture)
        VALUES (
          'drsmith', 
          'password123', 
          'drsmith@example.com', 
          'Dr. John Smith', 
          'doctor', 
          'Cardiology', 
          'Cardiologist with 10 years of experience',
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d'
        );
      `;
      
      // Add a patient
      await migrationClient`
        INSERT INTO users (username, password, email, full_name, role, bio, profile_picture)
        VALUES (
          'patient1', 
          'patient123', 
          'patient1@example.com', 
          'Sarah Johnson', 
          'patient', 
          'Patient with heart conditions',
          'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e'
        );
      `;
      
      console.log("Test users added successfully!");
    } else {
      console.log("Users already exist, skipping test data creation");
    }
    
    console.log("Database schema pushed successfully!");
  } catch (error) {
    console.error("Database schema push failed:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

main();