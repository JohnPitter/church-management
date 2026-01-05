// Domain Entity - Live Stream
// Represents church live streams and transmissions

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  thumbnailUrl?: string;
  isLive: boolean;
  scheduledDate: Date;
  duration?: number;
  viewCount: number;
  category: StreamCategory;
  status: StreamStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum StreamCategory {
  Culto = 'culto',
  Estudo = 'estudo',
  Reuniao = 'reuniao',
  Evento = 'evento'
}

export enum StreamStatus {
  Scheduled = 'scheduled',
  Live = 'live',
  Ended = 'ended',
  Cancelled = 'cancelled'
}

// Business Rules
export class LiveStreamEntity {
  static isLive(stream: LiveStream): boolean {
    return stream.status === StreamStatus.Live && stream.isLive;
  }

  static isScheduled(stream: LiveStream): boolean {
    return stream.status === StreamStatus.Scheduled && 
           new Date(stream.scheduledDate) > new Date();
  }

  static canEdit(stream: LiveStream): boolean {
    return stream.status === StreamStatus.Scheduled || 
           stream.status === StreamStatus.Live;
  }

  static canDelete(stream: LiveStream): boolean {
    return stream.status === StreamStatus.Scheduled || 
           stream.status === StreamStatus.Cancelled;
  }

  static formatDuration(durationInSeconds?: number): string {
    if (!durationInSeconds) return '--';
    
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  static getCategoryLabel(category: StreamCategory): string {
    switch (category) {
      case StreamCategory.Culto:
        return 'Culto';
      case StreamCategory.Estudo:
        return 'Estudo Bíblico';
      case StreamCategory.Reuniao:
        return 'Reunião';
      case StreamCategory.Evento:
        return 'Evento Especial';
      default:
        return category;
    }
  }

  static getStatusLabel(status: StreamStatus): string {
    switch (status) {
      case StreamStatus.Scheduled:
        return 'Agendado';
      case StreamStatus.Live:
        return 'Ao Vivo';
      case StreamStatus.Ended:
        return 'Finalizado';
      case StreamStatus.Cancelled:
        return 'Cancelado';
      default:
        return status;
    }
  }

  static canStart(stream: LiveStream): boolean {
    const now = new Date();
    const scheduledTime = new Date(stream.scheduledDate);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    return stream.status === StreamStatus.Scheduled && 
           minutesUntilStart <= 15; // Can start up to 15 minutes early
  }

  static shouldNotifyStart(stream: LiveStream): boolean {
    const now = new Date();
    const scheduledTime = new Date(stream.scheduledDate);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    return stream.status === StreamStatus.Scheduled && 
           minutesUntilStart <= 5 && minutesUntilStart > 0;
  }
}
