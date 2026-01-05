// Domain Repository Interface - Live Stream Repository
// Defines the contract for live stream data operations

import { LiveStream, StreamStatus, StreamCategory } from '../entities/LiveStream';

export interface ILiveStreamRepository {
  // Basic CRUD operations
  findById(id: string): Promise<LiveStream | null>;
  findAll(): Promise<LiveStream[]>;
  create(stream: Omit<LiveStream, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveStream>;
  update(id: string, data: Partial<LiveStream>): Promise<LiveStream>;
  delete(id: string): Promise<void>;

  // Status operations
  findByStatus(status: StreamStatus): Promise<LiveStream[]>;
  updateStatus(streamId: string, status: StreamStatus): Promise<void>;
  
  // Category operations
  findByCategory(category: StreamCategory): Promise<LiveStream[]>;
  
  // Live stream specific operations
  findLiveStreams(): Promise<LiveStream[]>;
  findScheduledStreams(): Promise<LiveStream[]>;
  findUpcomingStreams(limit?: number): Promise<LiveStream[]>;
  findPastStreams(limit?: number): Promise<LiveStream[]>;
  
  // Stream management operations
  startStream(streamId: string, streamUrl: string): Promise<void>;
  endStream(streamId: string, duration?: number): Promise<void>;
  cancelStream(streamId: string, reason: string, cancelledBy: string): Promise<void>;
  
  // Analytics operations
  updateViewCount(streamId: string, viewCount: number): Promise<void>;
  findMostViewed(limit?: number): Promise<LiveStream[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<LiveStream[]>;
}
