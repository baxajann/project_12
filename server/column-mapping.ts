// This file helps map between JavaScript camelCase and PostgreSQL snake_case columns

export const columnMappings = {
  // User table
  fullName: 'full_name',
  profilePicture: 'profile_picture',
  createdAt: 'created_at',
  
  // MedicalFile table
  userId: 'user_id',
  fileName: 'file_name',
  fileContent: 'file_content',
  fileType: 'file_type',
  uploadDate: 'upload_date',
  
  // Prediction table
  fileId: 'file_id',
  predictionData: 'prediction_data',
  
  // Conversation table
  doctorId: 'doctor_id',
  patientId: 'patient_id',
  lastMessageAt: 'last_message_at',
  
  // Message table
  conversationId: 'conversation_id',
  fromUserId: 'from_user_id',
  toUserId: 'to_user_id',
  sentAt: 'sent_at',
  
  // HealthMetric table
  metricType: 'metric_type',
  recordedAt: 'recorded_at'
};