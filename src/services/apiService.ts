import axios, { AxiosInstance } from 'axios';
import { APIResponse } from '../types/workflow';

export class APIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const processingTime = Date.now() - response.config.metadata.startTime;
        response.data.processingTime = processingTime;
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  async executeNode(endpoint: string, payload: any, nodeId: string): Promise<APIResponse> {
    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const responses = {
      '/idmscan/liveness': {
        success: true,
        data: {
          livenessScore: 0.95,
          faceDetected: true,
          quality: 'high',
          landmarks: 68,
          sessionId: 'live_' + Math.random().toString(36).substr(2, 9)
        }
      },
      '/idmscan/card-capture': {
        success: true,
        data: {
          cardType: 'driver_license',
          extractedText: {
            name: 'John Doe',
            dateOfBirth: '1990-01-01',
            idNumber: 'DL123456789'
          },
          confidence: 0.92,
          sessionId: 'card_' + Math.random().toString(36).substr(2, 9)
        }
      }
    };

    const response = responses[endpoint as keyof typeof responses];
    if (!response) {
      throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return {
      ...response,
      timestamp: new Date().toISOString(),
      processingTime: Math.round(1500 + Math.random() * 1000),
      nodeId
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const apiService = new APIService();