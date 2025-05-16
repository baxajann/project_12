import { 
  users, type User, type InsertUser, 
  medicalFiles, type MedicalFile, type InsertMedicalFile,
  predictions, type Prediction, type InsertPrediction,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  healthMetrics, type HealthMetric, type InsertHealthMetric,
  patientInfo, type PatientInfo, type InsertPatientInfo
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Database operations
  initializeDatabase?(): Promise<void>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updatePassword(userId: number, newPassword: string): Promise<boolean>;
  toggleTwoFactorAuth(userId: number, enabled: boolean): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getDoctors(): Promise<User[]>;
  getPatients(): Promise<User[]>;
  
  // Medical file operations
  createMedicalFile(file: InsertMedicalFile): Promise<MedicalFile>;
  getMedicalFile(id: number): Promise<MedicalFile | undefined>;
  getMedicalFilesByUserId(userId: number): Promise<MedicalFile[]>;
  updateFileStatus(id: number, status: "uploaded" | "analyzed"): Promise<MedicalFile | undefined>;
  
  // Prediction operations
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  getPredictionsByUserId(userId: number): Promise<Prediction[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  getMessagesBetweenUsers(fromUserId: number, toUserId: number): Promise<Message[]>;
  updateMessageStatus(id: number, status: "sent" | "delivered" | "read"): Promise<Message | undefined>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByUsers(doctorId: number, patientId: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  updateConversationLastMessage(id: number, timestamp: Date): Promise<Conversation | undefined>;
  deleteConversation(id: number, userId: number): Promise<boolean>;
  
  // Health metrics operations
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]>;
  getHealthMetricsByUserIdAndType(userId: number, metricType: string): Promise<HealthMetric[]>;
  
  // Patient info operations
  createPatientInfo(info: InsertPatientInfo): Promise<PatientInfo>;
  getPatientInfo(patientId: number): Promise<PatientInfo | undefined>;
  updatePatientInfo(patientId: number, info: Partial<InsertPatientInfo>): Promise<PatientInfo | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medicalFiles: Map<number, MedicalFile>;
  private predictions: Map<number, Prediction>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private healthMetrics: Map<number, HealthMetric>;
  private patientInfos: Map<number, PatientInfo>;
  
  private currentUserId: number;
  private currentFileId: number;
  private currentPredictionId: number;
  private currentMessageId: number;
  private currentConversationId: number;
  private currentHealthMetricId: number;
  private currentPatientInfoId: number;

  constructor() {
    this.users = new Map();
    this.medicalFiles = new Map();
    this.predictions = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.healthMetrics = new Map();
    this.patientInfos = new Map();
    
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentPredictionId = 1;
    this.currentMessageId = 1;
    this.currentConversationId = 1;
    this.currentHealthMetricId = 1;
    this.currentPatientInfoId = 1;
    
    // Add some initial data for testing
    this.createUser({
      username: "drsmith",
      password: "password123",
      email: "drsmith@example.com",
      fullName: "Dr. John Smith",
      role: "doctor",
      specialization: "Cardiology",
      bio: "Cardiologist with 10 years of experience",
      profilePicture: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
    });
    
    this.createUser({
      username: "patient1",
      password: "patient123",
      email: "patient1@example.com",
      fullName: "Sarah Johnson",
      role: "patient",
      bio: "Patient with heart conditions",
      profilePicture: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    
    // Ensure all optional fields are properly handled to match DB schema
    const user: User = {
      ...insertUser,
      id,
      createdAt,
      specialization: insertUser.specialization || null,
      profilePicture: insertUser.profilePicture || null,
      bio: insertUser.bio || null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // In a real application, we would hash the password
    const updatedUser = { ...user, password: newPassword };
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async toggleTwoFactorAuth(userId: number, enabled: boolean): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Add twoFactorEnabled field to user object
    const updatedUser = { 
      ...user, 
      twoFactorEnabled: enabled 
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getDoctors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "doctor");
  }
  
  async getPatients(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "patient");
  }
  
  // Medical file operations
  async createMedicalFile(file: InsertMedicalFile): Promise<MedicalFile> {
    const id = this.currentFileId++;
    const uploadDate = new Date();
    const status = file.status || "uploaded";
    const medicalFile: MedicalFile = { ...file, id, uploadDate, status };
    this.medicalFiles.set(id, medicalFile);
    return medicalFile;
  }
  
  async getMedicalFile(id: number): Promise<MedicalFile | undefined> {
    return this.medicalFiles.get(id);
  }
  
  async getMedicalFilesByUserId(userId: number): Promise<MedicalFile[]> {
    return Array.from(this.medicalFiles.values()).filter(
      (file) => file.userId === userId
    );
  }
  
  async updateFileStatus(id: number, status: "uploaded" | "analyzed"): Promise<MedicalFile | undefined> {
    const file = this.medicalFiles.get(id);
    if (!file) return undefined;
    
    const updatedFile: MedicalFile = { ...file, status };
    this.medicalFiles.set(id, updatedFile);
    return updatedFile;
  }
  
  // Prediction operations
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const createdAt = new Date();
    const newPrediction: Prediction = { ...prediction, id, createdAt };
    this.predictions.set(id, newPrediction);
    return newPrediction;
  }
  
  async getPrediction(id: number): Promise<Prediction | undefined> {
    return this.predictions.get(id);
  }
  
  async getPredictionsByUserId(userId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      (prediction) => prediction.userId === userId
    );
  }
  
  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const sentAt = new Date();
    const status = message.status || "sent";
    // Ensure imageData is never undefined, only string or null
    const imageData = message.imageData === undefined ? null : message.imageData;
    const newMessage: Message = { ...message, id, sentAt, status, imageData };
    this.messages.set(id, newMessage);
    
    // Update conversation last message timestamp
    const conversation = await this.getConversationByUsers(
      Math.min(message.fromUserId, message.toUserId),
      Math.max(message.fromUserId, message.toUserId)
    );
    
    if (conversation) {
      await this.updateConversationLastMessage(conversation.id, sentAt);
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
    
    console.log(`Getting messages for conversation ${conversationId} between doctor ${conversation.doctorId} and patient ${conversation.patientId}`);
    
    const messages = await this.getMessagesBetweenUsers(conversation.doctorId, conversation.patientId);
    console.log(`Found ${messages.length} messages`);
    
    return messages;
  }
  
  async getMessagesBetweenUsers(fromUserId: number, toUserId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.fromUserId === fromUserId && msg.toUserId === toUserId) || 
        (msg.fromUserId === toUserId && msg.toUserId === fromUserId)
      )
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async updateMessageStatus(id: number, status: "sent" | "delivered" | "read"): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { ...message, status };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { ...message, content };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const exists = this.messages.has(id);
    if (!exists) return false;
    
    return this.messages.delete(id);
  }
  
  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const createdAt = new Date();
    const lastMessageAt = new Date();
    const newConversation: Conversation = { ...conversation, id, lastMessageAt, createdAt };
    this.conversations.set(id, newConversation);
    return newConversation;
  }
  
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationByUsers(doctorId: number, patientId: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conv) => conv.doctorId === doctorId && conv.patientId === patientId
    );
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conv) => conv.doctorId === userId || conv.patientId === userId
    );
  }
  
  async updateConversationLastMessage(id: number, timestamp: Date): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation: Conversation = { ...conversation, lastMessageAt: timestamp };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }
  
  async deleteConversation(id: number, userId: number): Promise<boolean> {
    const conversation = this.conversations.get(id);
    
    // Check if conversation exists and user is part of it
    if (!conversation) return false;
    if (conversation.doctorId !== userId && conversation.patientId !== userId) return false;
    
    // Delete all messages associated with this conversation
    const messagesToDelete = Array.from(this.messages.values())
      .filter(message => 
        (message.fromUserId === conversation.doctorId && message.toUserId === conversation.patientId) ||
        (message.fromUserId === conversation.patientId && message.toUserId === conversation.doctorId)
      )
      .map(message => message.id);
    
    // Delete each message
    for (const messageId of messagesToDelete) {
      this.messages.delete(messageId);
    }
    
    // Finally delete the conversation
    this.conversations.delete(id);
    return true;
  }
  
  // Health metrics operations
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.currentHealthMetricId++;
    const recordedAt = new Date();
    const newMetric: HealthMetric = { ...metric, id, recordedAt };
    this.healthMetrics.set(id, newMetric);
    return newMetric;
  }
  
  async getHealthMetricsByUserId(userId: number): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }
  
  async getHealthMetricsByUserIdAndType(userId: number, metricType: string): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId && metric.metricType === metricType)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }
  
  // Patient info operations
  async createPatientInfo(info: InsertPatientInfo): Promise<PatientInfo> {
    const id = this.currentPatientInfoId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newPatientInfo: PatientInfo = {
      ...info,
      id,
      createdAt,
      updatedAt,
      bloodType: info.bloodType || null,
      allergies: info.allergies || null,
      chronicConditions: info.chronicConditions || null,
      medications: info.medications || null,
      notes: info.notes || null,
      height: info.height || null,
      weight: info.weight || null
    };
    
    this.patientInfos.set(id, newPatientInfo);
    // Also index by patientId for faster lookup
    this.patientInfos.set(info.patientId, newPatientInfo);
    
    return newPatientInfo;
  }
  
  async getPatientInfo(patientId: number): Promise<PatientInfo | undefined> {
    // First try to find directly by patientId which we use as an index
    const directInfo = this.patientInfos.get(patientId);
    if (directInfo) return directInfo;
    
    // If not found, look through all entries
    return Array.from(this.patientInfos.values()).find(
      (info) => info.patientId === patientId
    );
  }
  
  async updatePatientInfo(patientId: number, info: Partial<InsertPatientInfo>): Promise<PatientInfo | undefined> {
    // Get existing patient info
    const existingInfo = await this.getPatientInfo(patientId);
    
    if (!existingInfo) {
      // If info doesn't exist, create a new one if patientId is provided
      if (!info.patientId) {
        info.patientId = patientId;
      }
      
      return this.createPatientInfo(info as InsertPatientInfo);
    }
    
    // Update the existing info
    const updatedInfo: PatientInfo = {
      ...existingInfo,
      ...info,
      updatedAt: new Date()
    };
    
    this.patientInfos.set(existingInfo.id, updatedInfo);
    // Also update by patientId index
    this.patientInfos.set(patientId, updatedInfo);
    
    return updatedInfo;
  }
}

export const storage = new MemStorage();

// Function to get the storage implementation (either DB or in-memory)
export function getStorage(): IStorage {
  if ((global as any).dbStorage) {
    console.log("Using database storage");
    return (global as any).dbStorage;
  }
  console.log("Using in-memory storage");
  return storage;
}
