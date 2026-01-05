// Domain Entity - Asset (Patrimônio)
// Represents church assets and property inventory

export enum AssetCategory {
  RealEstate = 'real_estate', // Imóveis
  Vehicle = 'vehicle', // Veículos
  Equipment = 'equipment', // Equipamentos
  Furniture = 'furniture', // Móveis
  Electronics = 'electronics', // Eletrônicos
  Musical = 'musical', // Instrumentos Musicais
  BookLibrary = 'book_library', // Biblioteca/Livros
  Other = 'other' // Outros
}

export enum AssetCondition {
  Excellent = 'excellent', // Excelente
  Good = 'good', // Bom
  Fair = 'fair', // Regular
  Poor = 'poor', // Ruim
  NeedsRepair = 'needs_repair' // Precisa de Reparo
}

export enum AssetStatus {
  Active = 'active', // Em Uso
  Inactive = 'inactive', // Inativo
  UnderMaintenance = 'under_maintenance', // Em Manutenção
  Sold = 'sold', // Vendido
  Donated = 'donated', // Doado
  Lost = 'lost', // Perdido
  Stolen = 'stolen' // Roubado
}

export interface AssetImage {
  url: string;
  caption?: string;
  uploadedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  description: string;
  cost: number;
  performedBy: string;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  category: AssetCategory;

  // Financial Information
  acquisitionDate: Date;
  acquisitionValue: number;
  currentValue?: number;

  // Physical Details
  condition: AssetCondition;
  status: AssetStatus;
  location: string;
  serialNumber?: string;
  brand?: string;
  model?: string;

  // Documentation
  images?: AssetImage[];
  invoiceNumber?: string;
  warrantyExpiryDate?: Date;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date;

  // Maintenance
  maintenanceRecords?: MaintenanceRecord[];
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;

  // Metadata
  responsiblePerson?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Helper functions for Asset entity
export class AssetEntity {
  static getCategoryLabel(category: AssetCategory): string {
    const labels: Record<AssetCategory, string> = {
      [AssetCategory.RealEstate]: 'Imóveis',
      [AssetCategory.Vehicle]: 'Veículos',
      [AssetCategory.Equipment]: 'Equipamentos',
      [AssetCategory.Furniture]: 'Móveis',
      [AssetCategory.Electronics]: 'Eletrônicos',
      [AssetCategory.Musical]: 'Instrumentos Musicais',
      [AssetCategory.BookLibrary]: 'Biblioteca/Livros',
      [AssetCategory.Other]: 'Outros'
    };
    return labels[category];
  }

  static getConditionLabel(condition: AssetCondition): string {
    const labels: Record<AssetCondition, string> = {
      [AssetCondition.Excellent]: 'Excelente',
      [AssetCondition.Good]: 'Bom',
      [AssetCondition.Fair]: 'Regular',
      [AssetCondition.Poor]: 'Ruim',
      [AssetCondition.NeedsRepair]: 'Precisa de Reparo'
    };
    return labels[condition];
  }

  static getStatusLabel(status: AssetStatus): string {
    const labels: Record<AssetStatus, string> = {
      [AssetStatus.Active]: 'Em Uso',
      [AssetStatus.Inactive]: 'Inativo',
      [AssetStatus.UnderMaintenance]: 'Em Manutenção',
      [AssetStatus.Sold]: 'Vendido',
      [AssetStatus.Donated]: 'Doado',
      [AssetStatus.Lost]: 'Perdido',
      [AssetStatus.Stolen]: 'Roubado'
    };
    return labels[status];
  }

  static getConditionColor(condition: AssetCondition): string {
    const colors: Record<AssetCondition, string> = {
      [AssetCondition.Excellent]: 'bg-green-100 text-green-800',
      [AssetCondition.Good]: 'bg-blue-100 text-blue-800',
      [AssetCondition.Fair]: 'bg-yellow-100 text-yellow-800',
      [AssetCondition.Poor]: 'bg-orange-100 text-orange-800',
      [AssetCondition.NeedsRepair]: 'bg-red-100 text-red-800'
    };
    return colors[condition];
  }

  static getStatusColor(status: AssetStatus): string {
    const colors: Record<AssetStatus, string> = {
      [AssetStatus.Active]: 'bg-green-100 text-green-800',
      [AssetStatus.Inactive]: 'bg-gray-100 text-gray-800',
      [AssetStatus.UnderMaintenance]: 'bg-yellow-100 text-yellow-800',
      [AssetStatus.Sold]: 'bg-blue-100 text-blue-800',
      [AssetStatus.Donated]: 'bg-purple-100 text-purple-800',
      [AssetStatus.Lost]: 'bg-orange-100 text-orange-800',
      [AssetStatus.Stolen]: 'bg-red-100 text-red-800'
    };
    return colors[status];
  }

  static calculateDepreciation(
    acquisitionValue: number,
    acquisitionDate: Date,
    usefulLifeYears: number = 5
  ): number {
    const monthsSinceAcquisition =
      (new Date().getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const totalMonths = usefulLifeYears * 12;
    const depreciationRate = monthsSinceAcquisition / totalMonths;

    const depreciatedValue = acquisitionValue * (1 - Math.min(depreciationRate, 1));
    return Math.max(depreciatedValue, 0);
  }

  static validateAsset(asset: Partial<Asset>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!asset.name?.trim()) {
      errors.push('Nome é obrigatório');
    }
    if (!asset.category) {
      errors.push('Categoria é obrigatória');
    }
    if (!asset.acquisitionDate) {
      errors.push('Data de aquisição é obrigatória');
    }
    if (asset.acquisitionValue === undefined || asset.acquisitionValue < 0) {
      errors.push('Valor de aquisição é obrigatório e deve ser positivo');
    }
    if (!asset.condition) {
      errors.push('Condição é obrigatória');
    }
    if (!asset.status) {
      errors.push('Status é obrigatório');
    }
    if (!asset.location?.trim()) {
      errors.push('Localização é obrigatória');
    }

    // Date validations
    if (asset.acquisitionDate && asset.acquisitionDate > new Date()) {
      errors.push('Data de aquisição não pode ser no futuro');
    }
    if (asset.warrantyExpiryDate && asset.acquisitionDate && asset.warrantyExpiryDate < asset.acquisitionDate) {
      errors.push('Data de vencimento da garantia não pode ser anterior à data de aquisição');
    }
    if (asset.insuranceExpiryDate && asset.acquisitionDate && asset.insuranceExpiryDate < asset.acquisitionDate) {
      errors.push('Data de vencimento do seguro não pode ser anterior à data de aquisição');
    }
    if (asset.nextMaintenanceDate && asset.nextMaintenanceDate < new Date()) {
      errors.push('Data da próxima manutenção não pode ser no passado');
    }

    // Value validations
    if (asset.currentValue !== undefined && asset.currentValue < 0) {
      errors.push('Valor atual não pode ser negativo');
    }

    // String length validations
    if (asset.name && asset.name.length > 200) {
      errors.push('Nome não pode ter mais de 200 caracteres');
    }
    if (asset.description && asset.description.length > 1000) {
      errors.push('Descrição não pode ter mais de 1000 caracteres');
    }
    if (asset.location && asset.location.length > 300) {
      errors.push('Localização não pode ter mais de 300 caracteres');
    }

    return errors;
  }

  static isFormValid(asset: Partial<Asset>): boolean {
    return this.validateAsset(asset).length === 0;
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
