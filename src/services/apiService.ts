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
        const metadata = (response.config as any).metadata;
        if (metadata) {
          const processingTime = Date.now() - metadata.startTime;
          response.data.processingTime = processingTime;
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  async executeNode(endpoint: string, payload: any, nodeId: string): Promise<APIResponse> {
    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const responses = {
      '/jdmscan/liveness': {
        success: true,
        data: {
          livenessScore: 0.95,
          faceDetected: true,
          quality: 'high',
          landmarks: 68,
          sessionId: 'live_' + Math.random().toString(36).substr(2, 9),
          token: payload.token,
          latitude: payload.latitude,
          longitude: payload.longitude
        }
      },
      '/jdmscan/card-capture': {
        success: true,
        data: {
          cardType: 'driver_license',
          extractedText: {
            name: 'John Doe',
            dateOfBirth: '1990-01-01',
            idNumber: 'DL123456789'
          },
          confidence: 0.92,
          sessionId: 'card_' + Math.random().toString(36).substr(2, 9),
          token: payload.token,
          latitude: payload.latitude,
          longitude: payload.longitude,
          metadataIndex: payload.metadataIndex
        }
      },
      '/jdmscan/scanner': {
        success: true,
        data: {
          scanType: 'MRZ',
          extractedData: {
            documentType: 'P',
            documentNumber: 'L898902C3',
            nationality: 'UTO',
            dateOfBirth: '1974-08-12',
            sex: 'F',
            expirationDate: '2024-04-15',
            personalNumber: 'ZE184226B'
          },
          barcodeData: null,
          confidence: 0.97,
          sessionId: 'scan_' + Math.random().toString(36).substr(2, 9),
          token: payload.token,
          latitude: payload.latitude,
          longitude: payload.longitude
        }
      }
    };

    const response = responses[endpoint as keyof typeof responses];
    if (!response) {
      throw new Error(`Endpoint not found: ${endpoint}`);
    }

    return {
      ...response,
      timestamp: new Date().toISOString(),
      processingTime: Math.round(1500 + Math.random() * 1000),
      nodeId,
      endpoint
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const apiService = new APIService();