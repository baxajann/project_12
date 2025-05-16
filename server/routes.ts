import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket as WSWebSocket } from "ws";
import { getStorage } from "./storage";
import { 
  insertUserSchema, 
  insertMessageSchema, 
  insertMedicalFileSchema, 
  insertPredictionSchema,
  insertHealthMetricSchema,
  insertPatientInfoSchema,
  heartDiseaseSchema
} from "@shared/schema";
import { predictHeartDisease, processHeartDataFromCSV } from "./ml/heart_disease_model";
import session from "express-session";
import memoryStore from "memorystore";
import multer from "multer";
import path from "path";

// Extend the Express Session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Auth middleware
const authMiddleware = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const MemoryStore = memoryStore(session);
  
  // Session setup
  app.use(
    session({
      secret: "healthcare-platform-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // WebSocket server for chat
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    perMessageDeflate: false,
    clientTracking: true, // Enable client tracking
    // Increase server-side timeouts
    verifyClient: (info, callback) => {
      // Accept all connections
      callback(true);
    }
  });
  
  // Track WebSocket clients by user ID
  const clients = new Map<number, WSWebSocket>();
  
  // Track online status of users
  const onlineUsers = new Set<number>();
  
  // Broadcast online status to all connected clients
  function broadcastOnlineStatus() {
    const onlineUsersList = Array.from(onlineUsers);
    console.log("Broadcasting online users:", onlineUsersList);
    
    // Ensure WebSocket.OPEN is directly imported from ws
    const OPEN = WSWebSocket.OPEN; // This is 1
    
    // Clean up any stale connections before broadcasting
    clients.forEach((ws, userId) => {
      if (ws.readyState !== OPEN) {
        console.log(`Removing stale WebSocket for user ${userId}`);
        clients.delete(userId);
        onlineUsers.delete(userId);
      }
    });
    
    // Now broadcast to all remaining (valid) clients
    clients.forEach((ws, userId) => {
      try {
        if (ws.readyState === OPEN) {
          console.log(`Broadcasting online status to user ${userId}`);
          ws.send(JSON.stringify({
            type: "online_status",
            onlineUsers: onlineUsersList
          }));
        }
      } catch (error) {
        console.error(`Error broadcasting to user ${userId}:`, error);
        // Clean up this client if there was an error
        clients.delete(userId);
        onlineUsers.delete(userId);
      }
    });
  }
  
  wss.on("connection", (ws: WSWebSocket) => {
    console.log("WebSocket client connected");
    let userId: number | undefined;
    
    // Set up more frequent keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WSWebSocket.OPEN) {
        try {
          ws.ping("heartbeat");
        } catch (error) {
          console.error("Error sending ping:", error);
        }
      }
    }, 15000);
    
    // Listen for pong responses to detect closed connections
    ws.on("pong", () => {
      // Connection is still alive
      console.log(`Received pong from ${userId || 'unknown user'}`);
    });
    
    // Handle disconnect
    ws.on("close", () => {
      if (userId) {
        console.log(`WebSocket for user ${userId} disconnected`);
        clients.delete(userId);
        
        // Mark user as offline
        onlineUsers.delete(userId);
        
        // Broadcast updated online status to all clients
        broadcastOnlineStatus();
      }
      clearInterval(pingInterval);
    });
    
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received WebSocket message:", data);
        
        if (data.type === "register") {
          // Register this WebSocket with a user ID
          userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
            console.log(`Registered WebSocket for user ${userId}`);
            
            // Mark user as online
            onlineUsers.add(userId);
            
            // Broadcast updated online status to all clients
            broadcastOnlineStatus();
          }
        }
        else if (data.type === "chat_message") {
          // Get user info to verify roles
          const fromUser = await getStorage().getUser(data.fromUserId);
          const toUser = await getStorage().getUser(data.toUserId);
          
          if (!fromUser || !toUser) {
            console.error("User not found when sending message");
            return;
          }
          
          // Make sure we're sending to the right recipient based on roles
          // Make sure the sender (fromUser) is actually sending the message
          let actualFromUserId = data.fromUserId;
          // Make sure the recipient (toUser) is actually receiving the message
          let actualToUserId = data.toUserId;
          
          console.log(`Processing WebSocket message: fromUser=${actualFromUserId} (${fromUser.role}), toUser=${actualToUserId} (${toUser.role})`);
          
          // If we're receiving a message that a user is sending to themselves, this is a bug
          if (actualFromUserId === actualToUserId) {
            console.error("User trying to send message to themselves:", actualFromUserId);
            
            // Try to determine the correct recipient based on role
            if (fromUser.role === "patient") {
              // If sender is patient, find a doctor to send to
              const doctors = await getStorage().getDoctors();
              if (doctors.length > 0) {
                actualToUserId = doctors[0].id;
                console.log(`Corrected recipient to doctor ${actualToUserId}`);
              }
            } else if (fromUser.role === "doctor") {
              // If sender is doctor, must specify a patient
              console.error("Doctor trying to message themselves - must specify patient");
              return;
            }
          }
          
          // Debug info
          console.log(`Processing message from user ${actualFromUserId} (${fromUser.role}) to user ${actualToUserId} (${toUser.role})`)
          
          console.log(`Saving message from user ${actualFromUserId} to user ${actualToUserId}`);
          
          // Save the message to storage
          const newMessage = await getStorage().createMessage({
            fromUserId: actualFromUserId,
            toUserId: actualToUserId,
            content: data.content,
            imageData: data.imageData || undefined,
            status: "sent"
          });
          
          // Set current user's WebSocket client
          if (!userId && data.fromUserId) {
            const fromId = data.fromUserId;
            userId = fromId;
            clients.set(fromId, ws);
            
            // Also mark user as online if not already tracked
            onlineUsers.add(fromId);
            
            // Broadcast updated online status
            broadcastOnlineStatus();
          }
          
          // Update the conversation's last message timestamp or create a new one if needed
          let conversation = await getStorage().getConversationByUsers(
            actualFromUserId < actualToUserId ? actualFromUserId : actualToUserId,
            actualFromUserId < actualToUserId ? actualToUserId : actualFromUserId
          );
          
          if (conversation) {
            await getStorage().updateConversationLastMessage(conversation.id, new Date());
          } else {
            // Create a new conversation if one doesn't exist
            try {
              // Determine which user is the doctor and which is the patient
              const fromUser = await getStorage().getUser(data.fromUserId);
              const toUser = await getStorage().getUser(data.toUserId);
              
              if (!fromUser || !toUser) {
                console.error("User not found when creating conversation");
                return;
              }
              
              const doctorId = fromUser.role === "doctor" ? fromUser.id : toUser.id;
              const patientId = fromUser.role === "patient" ? fromUser.id : toUser.id;
              
              conversation = await getStorage().createConversation({
                doctorId,
                patientId
              });
            } catch (error: any) {
              console.error("Error creating conversation:", error);
            }
          }
          
          // First, update message status to delivered once we've saved it to the database
          await getStorage().updateMessageStatus(newMessage.id, "delivered");
          newMessage.status = "delivered"; // Update the object to reflect the new status
          
          console.log(`Attempting to deliver message ${newMessage.id} to recipient ${actualToUserId} and sender ${actualFromUserId}`);
          
          // Send to the intended recipient if they are connected
          const recipientWs = clients.get(actualToUserId);
          if (recipientWs && recipientWs.readyState === WSWebSocket.OPEN) {
            console.log(`Sending message to recipient ${actualToUserId} via their WebSocket`);
            recipientWs.send(JSON.stringify({
              type: "chat_message",
              message: newMessage
            }));
          } else {
            console.log(`Recipient ${actualToUserId} is not connected via WebSocket`);
          }
          
          // Always make sure the sender gets a confirmation
          const senderWs = clients.get(actualFromUserId);
          if (senderWs && senderWs.readyState === WSWebSocket.OPEN && senderWs !== ws) {
            console.log(`Sending confirmation to sender ${actualFromUserId} via their registered WebSocket`);
            senderWs.send(JSON.stringify({
              type: "chat_message",
              message: newMessage,
              status: "delivered"
            }));
          }
          
          // Always send back to the current WebSocket that sent the message
          console.log(`Sending confirmation back to originating WebSocket (user ${userId || 'unknown'})`);
          if (ws.readyState === WSWebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "chat_message",
              message: newMessage,
              status: "delivered"
            }));
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
    
    ws.on("close", () => {
      // Remove this client from the map when disconnected
      if (userId) {
        clients.delete(userId);
        console.log(`WebSocket for user ${userId} disconnected`);
      } else {
        console.log("WebSocket client disconnected");
      }
    });
  });
  
  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await getStorage().getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await getStorage().getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create the user
      const user = await getStorage().createUser(userData);
      
      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      // Save session explicitly to ensure it's stored before response
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate inputs
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await getStorage().getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Validate password (in a real app, use bcrypt for password hashing)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      // Save session explicitly to ensure it's stored before response
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/me", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await getStorage().getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update password
  app.post("/api/update-password", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Validate current password
      const user = await getStorage().getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.password !== currentPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const success = await getStorage().updatePassword(userId, newPassword);
      
      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Toggle two-factor authentication
  app.post("/api/toggle-2fa", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "Enabled status must be a boolean" });
      }
      
      const success = await getStorage().toggleTwoFactorAuth(userId, enabled);
      
      if (success) {
        res.json({ 
          message: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
          enabled
        });
      } else {
        res.status(500).json({ message: "Failed to update two-factor authentication status" });
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // User routes
  app.get("/api/users", authMiddleware, async (req, res) => {
    try {
      // Get users based on role
      // Doctors can see patients, patients can see all doctors
      const userId = req.session.userId as number;
      const role = req.session.userRole as string;
      
      let users;
      if (role === "doctor") {
        // Doctors see patients
        users = await getStorage().getPatients();
      } else {
        // Patients see all doctors
        users = await getStorage().getDoctors();
      }
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Chat routes
  app.get("/api/conversations", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const conversations = await getStorage().getConversationsByUserId(userId);
      
      // Fetch user details and unread message count for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.doctorId === userId ? conv.patientId : conv.doctorId;
          const otherUser = await getStorage().getUser(otherUserId);
          
          if (!otherUser) return null;
          
          const { password, ...otherUserWithoutPassword } = otherUser;
          
          // Get messages for this conversation
          const messages = await getStorage().getMessagesByConversation(conv.id);
          
          // Count unread messages sent to current user
          const unreadCount = messages.filter(
            msg => msg.toUserId === userId && msg.status !== "read"
          ).length;
          
          // Get the last message if one exists
          const lastMessage = messages.length > 0 ? 
            messages.sort((a, b) => 
              new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
            )[0] : null;
            
          return {
            ...conv,
            otherUser: otherUserWithoutPassword,
            unreadCount,
            lastMessage
          };
        })
      );
      
      // Sort conversations by unread count (highest first) then by last message time
      const sortedConversations = conversationsWithDetails
        .filter(Boolean)
        .sort((a: any, b: any) => {
          // First sort by unread count
          if (b.unreadCount !== a.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          
          // Then sort by last message time (most recent first)
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
      
      res.json(sortedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a conversation and all its messages
  app.delete("/api/conversations/:id", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const conversationId = parseInt(req.params.id);
      
      // Check for valid conversation ID
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get conversation to verify user access before deletion
      const conversation = await getStorage().getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Verify user is part of this conversation
      if (conversation.doctorId !== userId && conversation.patientId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this conversation" });
      }
      
      // Delete the conversation
      const success = await getStorage().deleteConversation(conversationId, userId);
      
      if (success) {
        res.status(200).json({ message: "Conversation deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete conversation" });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversations/:id/messages", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Handle the case for new conversations without an existing ID
      if (req.params.id === 'new') {
        // This is a new conversation, no messages yet
        return res.json([]);
      }
      
      const conversationId = parseInt(req.params.id);
      
      // Check for valid conversation ID
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get conversation
      const conversation = await getStorage().getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Verify user is part of this conversation
      if (conversation.doctorId !== userId && conversation.patientId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }
      
      const messages = await getStorage().getMessagesByConversation(conversationId);
      
      // Mark messages as read if they were sent to the current user
      const messagesToUpdate = messages.filter(
        msg => msg.toUserId === userId && msg.status !== "read"
      );
      
      if (messagesToUpdate.length > 0) {
        for (const message of messagesToUpdate) {
          await getStorage().updateMessageStatus(message.id, "read");
        }
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/messages", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      // Validate message data
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: userId
      });
      
      const newMessage = await getStorage().createMessage(messageData);
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  
  // Update message
  app.patch("/api/messages/:id", authMiddleware, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      const { content } = req.body;
      
      // Get the message to check ownership
      const message = await getStorage().getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if the user is the sender
      if (message.fromUserId !== userId) {
        return res.status(403).json({ message: "Unauthorized - You can only edit your own messages" });
      }
      
      // Update the message
      const updatedMessage = await getStorage().updateMessage(messageId, content);
      
      if (!updatedMessage) {
        return res.status(500).json({ message: "Failed to update message" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete message
  app.delete("/api/messages/:id", authMiddleware, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Get the message to check ownership
      const message = await getStorage().getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if the user is the sender
      if (message.fromUserId !== userId) {
        return res.status(403).json({ message: "Unauthorized - You can only delete your own messages" });
      }
      
      // Delete the message
      const success = await getStorage().deleteMessage(messageId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete message" });
      }
      
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Medical files routes
  app.post("/api/files", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      const fileData = insertMedicalFileSchema.parse({
        ...req.body,
        userId
      });
      
      const newFile = await getStorage().createMedicalFile(fileData);
      res.status(201).json(newFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(400).json({ message: "Invalid file data" });
    }
  });
  
  app.get("/api/files", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const files = await getStorage().getMedicalFilesByUserId(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Heart disease prediction feature and related endpoints removed as requested
  // Health metrics routes
  app.post("/api/health-metrics", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      
      const metricData = insertHealthMetricSchema.parse({
        ...req.body,
        userId
      });
      
      const newMetric = await getStorage().createHealthMetric(metricData);
      res.status(201).json(newMetric);
    } catch (error) {
      console.error("Error adding health metric:", error);
      res.status(400).json({ message: "Invalid health metric data" });
    }
  });
  
  // Configure multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: (req, file, cb) => {
      // Only accept CSV files
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    }
  });

  // Get model comparison metrics
  app.get("/api/predict/models", async (req, res) => {
    try {
      const { getModelComparison } = await import('./ml/heart_disease_model');
      const comparison = await getModelComparison();
      res.json(comparison);
    } catch (error) {
      console.error("Error getting model comparison:", error);
      res.status(500).json({ message: "Failed to get model comparison" });
    }
  });

  // Heart disease prediction endpoint
  app.post("/api/predict", async (req, res) => {
    try {
      const data = heartDiseaseSchema.parse(req.body);
      const result = await predictHeartDisease(data);
      
      res.json({
        prediction: result.prediction,
        confidence: result.confidence,
        modelPredictions: result.modelPredictions,
        bestModel: result.bestModel,
        modelComparison: result.modelComparison,
        explanations: result.explanations
      });
    } catch (error) {
      console.error("Error making prediction:", error);
      res.status(400).json({ message: "Invalid prediction data" });
    }
  });
  
  // CSV upload endpoint for heart disease prediction
  app.post("/api/predict/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file was uploaded" });
      }
      
      // Convert Buffer to string and process the CSV
      const csvContent = req.file.buffer.toString('utf-8');
      const processed = processHeartDataFromCSV(csvContent);
      
      if (!processed.processed || !processed.data) {
        return res.status(400).json({ message: processed.error || "Failed to process CSV file" });
      }
      
      // Use the processed data to make a prediction
      const result = await predictHeartDisease(processed.data);
      
      res.json({
        prediction: result.prediction,
        result: {
          prediction: result.prediction,
          confidence: result.confidence,
          explanations: result.explanations
        },
        data: processed.data
      });
    } catch (error) {
      console.error("Error processing CSV file:", error);
      res.status(400).json({ message: "Failed to process file: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/health-metrics", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const metricType = req.query.type as string;
      
      let metrics;
      if (metricType) {
        metrics = await getStorage().getHealthMetricsByUserIdAndType(userId, metricType);
      } else {
        metrics = await getStorage().getHealthMetricsByUserId(userId);
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Doctor-Patient connection routes
  app.get("/api/connections", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      
      let connections = [];
      if (userRole === "doctor") {
        // Get all patients connected to this doctor
        const conversations = await getStorage().getConversationsByUserId(userId);
        const patientIds = conversations
          .filter(conv => conv.doctorId === userId)
          .map(conv => conv.patientId);
        
        // Fetch patient details
        const patientPromises = patientIds.map(id => getStorage().getUser(id));
        const patients = await Promise.all(patientPromises);
        
        // Remove passwords from response
        connections = patients
          .filter(Boolean)
          .map(patient => {
            if (!patient) return null;
            const { password, ...patientWithoutPassword } = patient;
            return patientWithoutPassword;
          })
          .filter(Boolean);
      } else {
        // Get all doctors connected to this patient
        const conversations = await getStorage().getConversationsByUserId(userId);
        const doctorIds = conversations
          .filter(conv => conv.patientId === userId)
          .map(conv => conv.doctorId);
        
        // Fetch doctor details
        const doctorPromises = doctorIds.map(id => getStorage().getUser(id));
        const doctors = await Promise.all(doctorPromises);
        
        // Remove passwords from response
        connections = doctors
          .filter(Boolean)
          .map(doctor => {
            if (!doctor) return null;
            const { password, ...doctorWithoutPassword } = doctor;
            return doctorWithoutPassword;
          })
          .filter(Boolean);
      }
      
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/connect", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      const { userId: targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }
      
      // Get the target user
      const targetUser = await getStorage().getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      
      // Determine doctor and patient IDs based on roles
      let doctorId, patientId;
      if (userRole === "doctor") {
        doctorId = userId;
        patientId = targetUserId;
        
        // Check if target user is a patient
        if (targetUser.role !== "patient") {
          return res.status(400).json({ message: "Target user must be a patient" });
        }
      } else {
        doctorId = targetUserId;
        patientId = userId;
        
        // Check if target user is a doctor
        if (targetUser.role !== "doctor") {
          return res.status(400).json({ message: "Target user must be a doctor" });
        }
      }
      
      // Check if connection already exists
      const existingConversation = await getStorage().getConversationByUsers(doctorId, patientId);
      if (existingConversation) {
        return res.status(400).json({ message: "Connection already exists" });
      }
      
      // Create the conversation (connection)
      const newConversation = await getStorage().createConversation({
        doctorId,
        patientId
      });
      
      res.status(201).json(newConversation);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/connect/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      const targetUserId = parseInt(req.params.userId);
      
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }
      
      // Determine doctor and patient IDs based on roles
      let doctorId, patientId;
      if (userRole === "doctor") {
        doctorId = userId;
        patientId = targetUserId;
      } else {
        doctorId = targetUserId;
        patientId = userId;
      }
      
      // Find the conversation
      const conversation = await getStorage().getConversationByUsers(doctorId, patientId);
      if (!conversation) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Remove connection - in a real app, we'd have a dedicated method for this
      // For now, we'll keep the conversation but use it as a flag
      // In a real implementation, you'd have a method like:
      // await getStorage().removeConversation(conversation.id);
      
      res.json({ message: "Connection removed successfully" });
    } catch (error) {
      console.error("Error removing connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Patient Info routes
  app.get("/api/patientinfo/:patientId", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      const patientId = parseInt(req.params.patientId);
      
      if (isNaN(patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }
      
      // Security check - only allow doctors or the patient themselves to access
      if (userRole !== "doctor" && userId !== patientId) {
        return res.status(403).json({ message: "Unauthorized to access this patient's info" });
      }
      
      // Get patient info
      const patientInfo = await getStorage().getPatientInfo(patientId);
      
      if (!patientInfo) {
        return res.status(404).json({ message: "Patient information not found" });
      }
      
      res.json(patientInfo);
    } catch (error) {
      console.error("Error fetching patient info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/patientinfo", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      
      // Parse and validate request body
      const patientInfoData = insertPatientInfoSchema.parse(req.body);
      
      // Security check - only doctors can create patient info for others
      // For patients, they can only create for themselves
      if (userRole !== "doctor" && userId !== patientInfoData.patientId) {
        return res.status(403).json({ message: "Unauthorized to create info for this patient" });
      }
      
      // Check if patient exists
      const patient = await getStorage().getUser(patientInfoData.patientId);
      if (!patient || patient.role !== "patient") {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Check if patient info already exists
      const existingInfo = await getStorage().getPatientInfo(patientInfoData.patientId);
      
      let patientInfo;
      if (existingInfo) {
        // Update existing info
        patientInfo = await getStorage().updatePatientInfo(
          patientInfoData.patientId,
          patientInfoData
        );
      } else {
        // Create new info
        patientInfo = await getStorage().createPatientInfo(patientInfoData);
      }
      
      res.status(201).json(patientInfo);
    } catch (error: any) {
      console.error("Error creating patient info:", error);
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid patient information data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/patientinfo/:patientId", authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.userRole as string;
      const patientId = parseInt(req.params.patientId);
      
      if (isNaN(patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }
      
      // Security check - only allow doctors or the patient themselves to update
      if (userRole !== "doctor" && userId !== patientId) {
        return res.status(403).json({ message: "Unauthorized to update this patient's info" });
      }
      
      // Get patient info
      const existingInfo = await getStorage().getPatientInfo(patientId);
      
      if (!existingInfo) {
        return res.status(404).json({ message: "Patient information not found" });
      }
      
      // Update patient info
      const updatedInfo = await getStorage().updatePatientInfo(patientId, req.body);
      
      res.json(updatedInfo);
    } catch (error) {
      console.error("Error updating patient info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
