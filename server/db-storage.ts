import { 
  users, type User, type InsertUser, 
  medicalFiles, type MedicalFile, type InsertMedicalFile,
  predictions, type Prediction, type InsertPrediction,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  healthMetrics, type HealthMetric, type InsertHealthMetric,
  fileStatusEnum, messageStatusEnum, userRoleEnum
} from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { IStorage } from "./storage";

// Create postgres client
const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString);
const db = drizzle(client);

export class DbStorage implements IStorage {
  async initializeDatabase(): Promise<void> {
    try {
      // Push the schema to the database 
      // (This should really be done via migration scripts in production)
      console.log("Initializing database...");
      
      // Add initial test data after creating tables
      // Check if we already have users
      const existingUsers = await this.getAllUsers();
      if (existingUsers.length === 0) {
        console.log("Adding initial test data...");
        await this.createUser({
          username: "drsmith",
          password: "password123",
          email: "drsmith@example.com",
          fullName: "Dr. John Smith",
          role: "doctor",
          specialization: "Cardiology",
          bio: "Cardiologist with 10 years of experience",
          profilePicture: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
        });
        
        await this.createUser({
          username: "patient1",
          password: "patient123",
          email: "patient1@example.com",
          fullName: "Sarah Johnson",
          role: "patient",
          bio: "Patient with heart conditions",
          profilePicture: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
        });
      }
      
      console.log("Database initialization complete");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // In a real application, we would hash the password
      await db
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Failed to update password:", error);
      return false;
    }
  }
  
  async toggleTwoFactorAuth(userId: number, enabled: boolean): Promise<boolean> {
    try {
      // Note: we would need to add twoFactorEnabled column to the users table
      // For this demo, we'll just return true
      return true;
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDoctors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'doctor'));
  }

  async getPatients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'patient'));
  }

  // Medical file operations
  async createMedicalFile(file: InsertMedicalFile): Promise<MedicalFile> {
    const result = await db.insert(medicalFiles).values(file).returning();
    return result[0];
  }

  async getMedicalFile(id: number): Promise<MedicalFile | undefined> {
    const result = await db.select().from(medicalFiles).where(eq(medicalFiles.id, id));
    return result[0];
  }

  async getMedicalFilesByUserId(userId: number): Promise<MedicalFile[]> {
    return await db
      .select()
      .from(medicalFiles)
      .where(eq(medicalFiles.userId, userId));
  }

  async updateFileStatus(id: number, status: "uploaded" | "analyzed"): Promise<MedicalFile | undefined> {
    const result = await db
      .update(medicalFiles)
      .set({ status })
      .where(eq(medicalFiles.id, id))
      .returning();
    return result[0];
  }

  // Prediction operations
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const result = await db.insert(predictions).values(prediction).returning();
    return result[0];
  }

  async getPrediction(id: number): Promise<Prediction | undefined> {
    const result = await db.select().from(predictions).where(eq(predictions.id, id));
    return result[0];
  }

  async getPredictionsByUserId(userId: number): Promise<Prediction[]> {
    return await db
      .select()
      .from(predictions)
      .where(eq(predictions.userId, userId))
      .orderBy(desc(predictions.createdAt));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...message,
      status: message.status || "sent"
    }).returning();
    
    const newMessage = result[0];
    
    // Update conversation last message timestamp
    const conversation = await this.getConversationByUsers(
      Math.min(message.fromUserId, message.toUserId),
      Math.max(message.fromUserId, message.toUserId)
    );
    
    if (conversation) {
      await this.updateConversationLastMessage(conversation.id, newMessage.sentAt);
    } else {
      // Create a new conversation if it doesn't exist
      const fromUser = await this.getUser(message.fromUserId);
      const toUser = await this.getUser(message.toUserId);
      
      if (fromUser && toUser) {
        const doctorId = fromUser.role === 'doctor' ? fromUser.id : toUser.id;
        const patientId = fromUser.role === 'patient' ? fromUser.id : toUser.id;
        
        await this.createConversation({
          doctorId,
          patientId,
        });
      }
    }
    
    return newMessage;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return [];
    
    return this.getMessagesBetweenUsers(conversation.doctorId, conversation.patientId);
  }

  async getMessagesBetweenUsers(fromUserId: number, toUserId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.fromUserId, fromUserId),
            eq(messages.toUserId, toUserId)
          ),
          and(
            eq(messages.fromUserId, toUserId),
            eq(messages.toUserId, fromUserId)
          )
        )
      )
      .orderBy(messages.sentAt);
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return result[0];
  }

  async updateMessageStatus(id: number, status: "sent" | "delivered" | "read"): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ status })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }
  
  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ content })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id));
    return result.count > 0;
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getConversationByUsers(doctorId: number, patientId: number): Promise<Conversation | undefined> {
    const result = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.doctorId, doctorId),
          eq(conversations.patientId, patientId)
        )
      );
    return result[0];
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.doctorId, userId),
          eq(conversations.patientId, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async updateConversationLastMessage(id: number, timestamp: Date): Promise<Conversation | undefined> {
    const result = await db
      .update(conversations)
      .set({ lastMessageAt: timestamp })
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  }

  // Health metrics operations
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const result = await db.insert(healthMetrics).values(metric).returning();
    return result[0];
  }

  async getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]> {
    return await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt));
  }

  async getHealthMetricsByUserIdAndType(userId: number, metricType: string): Promise<HealthMetric[]> {
    return await db
      .select()
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          eq(healthMetrics.metricType, metricType)
        )
      )
      .orderBy(desc(healthMetrics.recordedAt));
  }
}