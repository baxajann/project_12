import { pgTable, text, serial, integer, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['doctor', 'patient']);
export const fileStatusEnum = pgEnum('file_status', ['uploaded', 'analyzed']);
export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  specialization: text("specialization"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medical files table
export const medicalFiles = pgTable("medical_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileContent: text("file_content").notNull(), // Stored as base64 or file path
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  status: fileStatusEnum("status").default("uploaded").notNull(),
});

// Heart disease prediction results
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileId: integer("file_id").references(() => medicalFiles.id).notNull(),
  predictionData: json("prediction_data").notNull(),
  result: boolean("result").notNull(), // true for positive prediction, false for negative
  confidence: integer("confidence").notNull(), // percentage confidence
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages for chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageData: text("image_data"), // Optional image data as base64
  status: messageStatusEnum("status").default("sent").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Chat conversations to group messages
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => users.id).notNull(),
  patientId: integer("patient_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient health metrics to track over time
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  metricType: text("metric_type").notNull(), // e.g. "blood_pressure", "cholesterol", "heart_rate"
  value: text("value").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Patient information table for doctors to manage
export const patientInfo = pgTable("patient_info", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => users.id).notNull().unique(),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  medications: text("medications"),
  notes: text("notes"),
  height: text("height"),
  weight: text("weight"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for user insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Schema for medical file insertion
export const insertMedicalFileSchema = createInsertSchema(medicalFiles).omit({
  id: true,
  uploadDate: true,
});

// Schema for prediction insertion
export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

// Schema for message insertion
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true, 
  sentAt: true,
});

// Schema for conversation insertion
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

// Schema for health metric insertion
export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  recordedAt: true,
});

// Schema for patient info insertion/update
export const insertPatientInfoSchema = createInsertSchema(patientInfo).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MedicalFile = typeof medicalFiles.$inferSelect;
export type InsertMedicalFile = z.infer<typeof insertMedicalFileSchema>;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;

export type PatientInfo = typeof patientInfo.$inferSelect;
export type InsertPatientInfo = z.infer<typeof insertPatientInfoSchema>;

// Heart disease data structure (matches the CSV)
export const heartDiseaseSchema = z.object({
  age: z.number(),
  sex: z.number(), // 1 = male, 0 = female
  cp: z.number(), // chest pain type
  trestbps: z.number(), // resting blood pressure
  chol: z.number(), // serum cholesterol
  fbs: z.number(), // fasting blood sugar > 120 mg/dl
  restecg: z.number(), // resting electrocardiographic results
  thalach: z.number(), // maximum heart rate achieved
  exang: z.number(), // exercise induced angina
  oldpeak: z.number(), // ST depression induced by exercise relative to rest
  slope: z.number(), // the slope of the peak exercise ST segment
  ca: z.number(), // number of major vessels colored by fluoroscopy
  thal: z.number(), // thalassemia
});

export type HeartDiseaseData = z.infer<typeof heartDiseaseSchema>;
