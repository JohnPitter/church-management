// Unit Tests - Asset Entity
// Tests for Asset (Patrimonio) business rules, enums, and validations

import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetImage,
  MaintenanceRecord,
  AssetEntity
} from '../Asset';

describe('Asset Enums', () => {
  describe('AssetCategory', () => {
    it('should have all expected category values', () => {
      expect(AssetCategory.RealEstate).toBe('real_estate');
      expect(AssetCategory.Vehicle).toBe('vehicle');
      expect(AssetCategory.Equipment).toBe('equipment');
      expect(AssetCategory.Furniture).toBe('furniture');
      expect(AssetCategory.Electronics).toBe('electronics');
      expect(AssetCategory.Musical).toBe('musical');
      expect(AssetCategory.BookLibrary).toBe('book_library');
      expect(AssetCategory.Other).toBe('other');
    });

    it('should have exactly 8 category values', () => {
      const categoryValues = Object.values(AssetCategory);
      expect(categoryValues).toHaveLength(8);
    });
  });

  describe('AssetCondition', () => {
    it('should have all expected condition values', () => {
      expect(AssetCondition.Excellent).toBe('excellent');
      expect(AssetCondition.Good).toBe('good');
      expect(AssetCondition.Fair).toBe('fair');
      expect(AssetCondition.Poor).toBe('poor');
      expect(AssetCondition.NeedsRepair).toBe('needs_repair');
    });

    it('should have exactly 5 condition values', () => {
      const conditionValues = Object.values(AssetCondition);
      expect(conditionValues).toHaveLength(5);
    });
  });

  describe('AssetStatus', () => {
    it('should have all expected status values', () => {
      expect(AssetStatus.Active).toBe('active');
      expect(AssetStatus.Inactive).toBe('inactive');
      expect(AssetStatus.UnderMaintenance).toBe('under_maintenance');
      expect(AssetStatus.Sold).toBe('sold');
      expect(AssetStatus.Donated).toBe('donated');
      expect(AssetStatus.Lost).toBe('lost');
      expect(AssetStatus.Stolen).toBe('stolen');
    });

    it('should have exactly 7 status values', () => {
      const statusValues = Object.values(AssetStatus);
      expect(statusValues).toHaveLength(7);
    });
  });
});

describe('AssetEntity', () => {
  // Helper function to create a test asset
  const createTestAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: 'asset-1',
    name: 'Projetor Epson',
    description: 'Projetor para auditorio principal',
    category: AssetCategory.Electronics,
    acquisitionDate: new Date('2022-01-15'),
    acquisitionValue: 5000,
    currentValue: 4000,
    condition: AssetCondition.Good,
    status: AssetStatus.Active,
    location: 'Auditorio Principal',
    serialNumber: 'EP-12345',
    brand: 'Epson',
    model: 'PowerLite 2250U',
    images: [],
    invoiceNumber: 'NF-001',
    warrantyExpiryDate: new Date('2025-01-15'),
    maintenanceRecords: [],
    responsiblePerson: 'Joao Silva',
    notes: 'Equipamento em bom estado',
    tags: ['audiovisual', 'auditorio'],
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
    updatedBy: 'admin',
    ...overrides
  });

  describe('getCategoryLabel', () => {
    it('should return correct label for RealEstate', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.RealEstate)).toBe('Imóveis');
    });

    it('should return correct label for Vehicle', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Vehicle)).toBe('Veículos');
    });

    it('should return correct label for Equipment', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Equipment)).toBe('Equipamentos');
    });

    it('should return correct label for Furniture', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Furniture)).toBe('Móveis');
    });

    it('should return correct label for Electronics', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Electronics)).toBe('Eletrônicos');
    });

    it('should return correct label for Musical', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Musical)).toBe('Instrumentos Musicais');
    });

    it('should return correct label for BookLibrary', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.BookLibrary)).toBe('Biblioteca/Livros');
    });

    it('should return correct label for Other', () => {
      expect(AssetEntity.getCategoryLabel(AssetCategory.Other)).toBe('Outros');
    });

    it('should return labels for all categories', () => {
      const categories = Object.values(AssetCategory);
      categories.forEach(category => {
        const label = AssetEntity.getCategoryLabel(category);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getConditionLabel', () => {
    it('should return correct label for Excellent', () => {
      expect(AssetEntity.getConditionLabel(AssetCondition.Excellent)).toBe('Excelente');
    });

    it('should return correct label for Good', () => {
      expect(AssetEntity.getConditionLabel(AssetCondition.Good)).toBe('Bom');
    });

    it('should return correct label for Fair', () => {
      expect(AssetEntity.getConditionLabel(AssetCondition.Fair)).toBe('Regular');
    });

    it('should return correct label for Poor', () => {
      expect(AssetEntity.getConditionLabel(AssetCondition.Poor)).toBe('Ruim');
    });

    it('should return correct label for NeedsRepair', () => {
      expect(AssetEntity.getConditionLabel(AssetCondition.NeedsRepair)).toBe('Precisa de Reparo');
    });

    it('should return labels for all conditions', () => {
      const conditions = Object.values(AssetCondition);
      conditions.forEach(condition => {
        const label = AssetEntity.getConditionLabel(condition);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for Active', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Active)).toBe('Em Uso');
    });

    it('should return correct label for Inactive', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Inactive)).toBe('Inativo');
    });

    it('should return correct label for UnderMaintenance', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.UnderMaintenance)).toBe('Em Manutenção');
    });

    it('should return correct label for Sold', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Sold)).toBe('Vendido');
    });

    it('should return correct label for Donated', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Donated)).toBe('Doado');
    });

    it('should return correct label for Lost', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Lost)).toBe('Perdido');
    });

    it('should return correct label for Stolen', () => {
      expect(AssetEntity.getStatusLabel(AssetStatus.Stolen)).toBe('Roubado');
    });

    it('should return labels for all statuses', () => {
      const statuses = Object.values(AssetStatus);
      statuses.forEach(status => {
        const label = AssetEntity.getStatusLabel(status);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getConditionColor', () => {
    it('should return green classes for Excellent', () => {
      const color = AssetEntity.getConditionColor(AssetCondition.Excellent);
      expect(color).toBe('bg-green-100 text-green-800');
    });

    it('should return blue classes for Good', () => {
      const color = AssetEntity.getConditionColor(AssetCondition.Good);
      expect(color).toBe('bg-blue-100 text-blue-800');
    });

    it('should return yellow classes for Fair', () => {
      const color = AssetEntity.getConditionColor(AssetCondition.Fair);
      expect(color).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return orange classes for Poor', () => {
      const color = AssetEntity.getConditionColor(AssetCondition.Poor);
      expect(color).toBe('bg-orange-100 text-orange-800');
    });

    it('should return red classes for NeedsRepair', () => {
      const color = AssetEntity.getConditionColor(AssetCondition.NeedsRepair);
      expect(color).toBe('bg-red-100 text-red-800');
    });

    it('should return valid Tailwind classes for all conditions', () => {
      const conditions = Object.values(AssetCondition);
      conditions.forEach(condition => {
        const color = AssetEntity.getConditionColor(condition);
        expect(color).toMatch(/^bg-\w+-100 text-\w+-800$/);
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return green classes for Active', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Active);
      expect(color).toBe('bg-green-100 text-green-800');
    });

    it('should return gray classes for Inactive', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Inactive);
      expect(color).toBe('bg-gray-100 text-gray-800');
    });

    it('should return yellow classes for UnderMaintenance', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.UnderMaintenance);
      expect(color).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return blue classes for Sold', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Sold);
      expect(color).toBe('bg-blue-100 text-blue-800');
    });

    it('should return purple classes for Donated', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Donated);
      expect(color).toBe('bg-purple-100 text-purple-800');
    });

    it('should return orange classes for Lost', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Lost);
      expect(color).toBe('bg-orange-100 text-orange-800');
    });

    it('should return red classes for Stolen', () => {
      const color = AssetEntity.getStatusColor(AssetStatus.Stolen);
      expect(color).toBe('bg-red-100 text-red-800');
    });

    it('should return valid Tailwind classes for all statuses', () => {
      const statuses = Object.values(AssetStatus);
      statuses.forEach(status => {
        const color = AssetEntity.getStatusColor(status);
        expect(color).toMatch(/^bg-\w+-100 text-\w+-800$/);
      });
    });
  });

  describe('calculateDepreciation', () => {
    it('should return full value for brand new asset', () => {
      const acquisitionValue = 10000;
      const acquisitionDate = new Date(); // Today
      const depreciatedValue = AssetEntity.calculateDepreciation(acquisitionValue, acquisitionDate);

      // Should be very close to original value
      expect(depreciatedValue).toBeCloseTo(acquisitionValue, 0);
    });

    it('should return approximately half value after half useful life', () => {
      const acquisitionValue = 10000;
      const usefulLifeYears = 4;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 2); // 2 years ago

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        usefulLifeYears
      );

      // Should be around 50% of original value (with tolerance for day calculation)
      expect(depreciatedValue).toBeGreaterThan(4000);
      expect(depreciatedValue).toBeLessThan(6000);
    });

    it('should return zero after full useful life', () => {
      const acquisitionValue = 10000;
      const usefulLifeYears = 5;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 6); // 6 years ago (more than useful life)

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        usefulLifeYears
      );

      expect(depreciatedValue).toBe(0);
    });

    it('should not return negative values', () => {
      const acquisitionValue = 10000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 20); // Way past useful life

      const depreciatedValue = AssetEntity.calculateDepreciation(acquisitionValue, acquisitionDate);

      expect(depreciatedValue).toBeGreaterThanOrEqual(0);
    });

    it('should use default useful life of 5 years when not specified', () => {
      const acquisitionValue = 10000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 5); // 5 years ago

      const depreciatedValue = AssetEntity.calculateDepreciation(acquisitionValue, acquisitionDate);

      // After 5 years with 5 year useful life, should be close to 0
      expect(depreciatedValue).toBeLessThanOrEqual(500); // Allow small tolerance
    });

    it('should calculate correctly for different useful life values', () => {
      const acquisitionValue = 12000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 3); // 3 years ago

      // With 3 year useful life, should be close to 0
      const depreciatedValue3Years = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        3
      );
      expect(depreciatedValue3Years).toBeLessThanOrEqual(500);

      // With 10 year useful life, should be around 70% (30% depreciated)
      const depreciatedValue10Years = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        10
      );
      expect(depreciatedValue10Years).toBeGreaterThan(7000);
    });

    it('should handle zero acquisition value', () => {
      const depreciatedValue = AssetEntity.calculateDepreciation(0, new Date(), 5);
      expect(depreciatedValue).toBe(0);
    });
  });

  describe('validateAsset', () => {
    describe('Required Field Validations', () => {
      it('should return error when name is missing', () => {
        const asset = createTestAsset({ name: '' });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Nome é obrigatório');
      });

      it('should return error when name is only whitespace', () => {
        const asset = createTestAsset({ name: '   ' });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Nome é obrigatório');
      });

      it('should return error when category is missing', () => {
        const asset = createTestAsset({ category: undefined as unknown as AssetCategory });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Categoria é obrigatória');
      });

      it('should return error when acquisitionDate is missing', () => {
        const asset = createTestAsset({ acquisitionDate: undefined as unknown as Date });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Data de aquisição é obrigatória');
      });

      it('should return error when acquisitionValue is negative', () => {
        const asset = createTestAsset({ acquisitionValue: -100 });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Valor de aquisição é obrigatório e deve ser positivo');
      });

      it('should return error when acquisitionValue is undefined', () => {
        const asset = createTestAsset({ acquisitionValue: undefined as unknown as number });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Valor de aquisição é obrigatório e deve ser positivo');
      });

      it('should return error when condition is missing', () => {
        const asset = createTestAsset({ condition: undefined as unknown as AssetCondition });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Condição é obrigatória');
      });

      it('should return error when status is missing', () => {
        const asset = createTestAsset({ status: undefined as unknown as AssetStatus });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Status é obrigatório');
      });

      it('should return error when location is missing', () => {
        const asset = createTestAsset({ location: '' });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Localização é obrigatória');
      });

      it('should return error when location is only whitespace', () => {
        const asset = createTestAsset({ location: '   ' });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Localização é obrigatória');
      });
    });

    describe('Date Validations', () => {
      it('should return error when acquisitionDate is in the future', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const asset = createTestAsset({ acquisitionDate: futureDate });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Data de aquisição não pode ser no futuro');
      });

      it('should return error when warrantyExpiryDate is before acquisitionDate', () => {
        const asset = createTestAsset({
          acquisitionDate: new Date('2023-01-01'),
          warrantyExpiryDate: new Date('2022-01-01')
        });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Data de vencimento da garantia não pode ser anterior à data de aquisição');
      });

      it('should return error when insuranceExpiryDate is before acquisitionDate', () => {
        const asset = createTestAsset({
          acquisitionDate: new Date('2023-01-01'),
          insuranceExpiryDate: new Date('2022-01-01')
        });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Data de vencimento do seguro não pode ser anterior à data de aquisição');
      });

      it('should return error when nextMaintenanceDate is in the past', () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const asset = createTestAsset({ nextMaintenanceDate: pastDate });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Data da próxima manutenção não pode ser no passado');
      });

      it('should not return date errors when optional dates are undefined', () => {
        const asset = createTestAsset({
          warrantyExpiryDate: undefined,
          insuranceExpiryDate: undefined,
          nextMaintenanceDate: undefined
        });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Data de vencimento da garantia não pode ser anterior à data de aquisição');
        expect(errors).not.toContain('Data de vencimento do seguro não pode ser anterior à data de aquisição');
        expect(errors).not.toContain('Data da próxima manutenção não pode ser no passado');
      });
    });

    describe('Value Validations', () => {
      it('should return error when currentValue is negative', () => {
        const asset = createTestAsset({ currentValue: -500 });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Valor atual não pode ser negativo');
      });

      it('should not return error when currentValue is zero', () => {
        const asset = createTestAsset({ currentValue: 0 });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Valor atual não pode ser negativo');
      });

      it('should not return error when currentValue is undefined', () => {
        const asset = createTestAsset({ currentValue: undefined });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Valor atual não pode ser negativo');
      });

      it('should allow acquisitionValue of zero', () => {
        const asset = createTestAsset({ acquisitionValue: 0 });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Valor de aquisição é obrigatório e deve ser positivo');
      });
    });

    describe('String Length Validations', () => {
      it('should return error when name exceeds 200 characters', () => {
        const longName = 'A'.repeat(201);
        const asset = createTestAsset({ name: longName });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Nome não pode ter mais de 200 caracteres');
      });

      it('should not return error when name is exactly 200 characters', () => {
        const exactName = 'A'.repeat(200);
        const asset = createTestAsset({ name: exactName });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Nome não pode ter mais de 200 caracteres');
      });

      it('should return error when description exceeds 1000 characters', () => {
        const longDescription = 'B'.repeat(1001);
        const asset = createTestAsset({ description: longDescription });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Descrição não pode ter mais de 1000 caracteres');
      });

      it('should not return error when description is exactly 1000 characters', () => {
        const exactDescription = 'B'.repeat(1000);
        const asset = createTestAsset({ description: exactDescription });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Descrição não pode ter mais de 1000 caracteres');
      });

      it('should return error when location exceeds 300 characters', () => {
        const longLocation = 'C'.repeat(301);
        const asset = createTestAsset({ location: longLocation });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toContain('Localização não pode ter mais de 300 caracteres');
      });

      it('should not return error when location is exactly 300 characters', () => {
        const exactLocation = 'C'.repeat(300);
        const asset = createTestAsset({ location: exactLocation });
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).not.toContain('Localização não pode ter mais de 300 caracteres');
      });
    });

    describe('Valid Asset', () => {
      it('should return empty array for valid asset', () => {
        const asset = createTestAsset();
        const errors = AssetEntity.validateAsset(asset);
        expect(errors).toHaveLength(0);
      });

      it('should return empty array for minimal valid asset', () => {
        const minimalAsset: Partial<Asset> = {
          name: 'Test Asset',
          category: AssetCategory.Equipment,
          acquisitionDate: new Date('2023-01-01'),
          acquisitionValue: 1000,
          condition: AssetCondition.Good,
          status: AssetStatus.Active,
          location: 'Storage Room'
        };
        const errors = AssetEntity.validateAsset(minimalAsset);
        expect(errors).toHaveLength(0);
      });
    });

    describe('Multiple Errors', () => {
      it('should return multiple errors for multiple invalid fields', () => {
        const invalidAsset: Partial<Asset> = {
          name: '',
          category: undefined as unknown as AssetCategory,
          acquisitionValue: -100,
          location: ''
        };
        const errors = AssetEntity.validateAsset(invalidAsset);

        expect(errors.length).toBeGreaterThan(3);
        expect(errors).toContain('Nome é obrigatório');
        expect(errors).toContain('Categoria é obrigatória');
        expect(errors).toContain('Valor de aquisição é obrigatório e deve ser positivo');
        expect(errors).toContain('Localização é obrigatória');
      });
    });
  });

  describe('isFormValid', () => {
    it('should return true for valid asset', () => {
      const asset = createTestAsset();
      expect(AssetEntity.isFormValid(asset)).toBe(true);
    });

    it('should return false for invalid asset', () => {
      const invalidAsset: Partial<Asset> = {
        name: '',
        category: undefined as unknown as AssetCategory
      };
      expect(AssetEntity.isFormValid(invalidAsset)).toBe(false);
    });

    it('should return true when all required fields are valid', () => {
      const minimalAsset: Partial<Asset> = {
        name: 'Valid Asset',
        category: AssetCategory.Furniture,
        acquisitionDate: new Date('2023-06-15'),
        acquisitionValue: 500,
        condition: AssetCondition.Fair,
        status: AssetStatus.Active,
        location: 'Office'
      };
      expect(AssetEntity.isFormValid(minimalAsset)).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive values as BRL currency', () => {
      const formatted = AssetEntity.formatCurrency(1234.56);
      expect(formatted).toMatch(/R\$\s*1\.234,56/);
    });

    it('should format zero as BRL currency', () => {
      const formatted = AssetEntity.formatCurrency(0);
      expect(formatted).toMatch(/R\$\s*0,00/);
    });

    it('should format large values correctly', () => {
      const formatted = AssetEntity.formatCurrency(1000000);
      expect(formatted).toMatch(/R\$\s*1\.000\.000,00/);
    });

    it('should format negative values as BRL currency', () => {
      const formatted = AssetEntity.formatCurrency(-500);
      expect(formatted).toMatch(/-?\s*R\$\s*500,00/);
    });

    it('should round to 2 decimal places', () => {
      const formatted = AssetEntity.formatCurrency(123.456);
      expect(formatted).toMatch(/R\$\s*123,4[56]/);
    });

    it('should handle very small values', () => {
      const formatted = AssetEntity.formatCurrency(0.01);
      expect(formatted).toMatch(/R\$\s*0,01/);
    });
  });
});

describe('Asset Interface', () => {
  describe('MaintenanceRecord', () => {
    it('should create valid maintenance record', () => {
      const record: MaintenanceRecord = {
        id: 'maint-1',
        date: new Date('2024-01-15'),
        description: 'Troca de lampada do projetor',
        cost: 150.00,
        performedBy: 'Tecnico Autorizado',
        notes: 'Garantia de 90 dias'
      };

      expect(record.id).toBe('maint-1');
      expect(record.date).toEqual(new Date('2024-01-15'));
      expect(record.description).toBe('Troca de lampada do projetor');
      expect(record.cost).toBe(150.00);
      expect(record.performedBy).toBe('Tecnico Autorizado');
      expect(record.notes).toBe('Garantia de 90 dias');
    });

    it('should allow maintenance record without optional notes', () => {
      const record: MaintenanceRecord = {
        id: 'maint-2',
        date: new Date(),
        description: 'Limpeza geral',
        cost: 50,
        performedBy: 'Equipe interna'
      };

      expect(record.notes).toBeUndefined();
    });
  });

  describe('AssetImage', () => {
    it('should create valid asset image', () => {
      const image: AssetImage = {
        url: 'https://storage.example.com/asset-photo.jpg',
        caption: 'Vista frontal do equipamento',
        uploadedAt: new Date('2024-01-10')
      };

      expect(image.url).toBe('https://storage.example.com/asset-photo.jpg');
      expect(image.caption).toBe('Vista frontal do equipamento');
      expect(image.uploadedAt).toEqual(new Date('2024-01-10'));
    });

    it('should allow asset image without optional caption', () => {
      const image: AssetImage = {
        url: 'https://storage.example.com/asset.png',
        uploadedAt: new Date()
      };

      expect(image.caption).toBeUndefined();
    });
  });
});

describe('Maintenance Tracking', () => {
  const createAssetWithMaintenance = (): Asset => ({
    id: 'asset-maintenance',
    name: 'Ar Condicionado',
    description: 'Ar condicionado split 12000 BTUs',
    category: AssetCategory.Equipment,
    acquisitionDate: new Date('2020-06-01'),
    acquisitionValue: 2500,
    condition: AssetCondition.Good,
    status: AssetStatus.Active,
    location: 'Sala de reunioes',
    maintenanceRecords: [
      {
        id: 'maint-1',
        date: new Date('2021-06-01'),
        description: 'Limpeza e manutencao preventiva',
        cost: 200,
        performedBy: 'TecAr LTDA'
      },
      {
        id: 'maint-2',
        date: new Date('2022-06-01'),
        description: 'Troca de filtro e limpeza',
        cost: 250,
        performedBy: 'TecAr LTDA'
      },
      {
        id: 'maint-3',
        date: new Date('2023-06-01'),
        description: 'Manutencao completa',
        cost: 350,
        performedBy: 'Refrigeracao XYZ',
        notes: 'Substituicao de gas refrigerante'
      }
    ],
    lastMaintenanceDate: new Date('2023-06-01'),
    nextMaintenanceDate: new Date('2027-06-01'),
    createdAt: new Date('2020-06-01'),
    updatedAt: new Date('2023-06-01'),
    createdBy: 'admin',
    updatedBy: 'admin'
  });

  it('should track maintenance records correctly', () => {
    const asset = createAssetWithMaintenance();
    expect(asset.maintenanceRecords).toHaveLength(3);
  });

  it('should calculate total maintenance cost', () => {
    const asset = createAssetWithMaintenance();
    const totalCost = asset.maintenanceRecords!.reduce((sum, record) => sum + record.cost, 0);
    expect(totalCost).toBe(800); // 200 + 250 + 350
  });

  it('should have last maintenance date matching most recent record', () => {
    const asset = createAssetWithMaintenance();
    const lastRecord = asset.maintenanceRecords!.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    expect(asset.lastMaintenanceDate).toEqual(lastRecord.date);
  });

  it('should have next maintenance date in the future', () => {
    const asset = createAssetWithMaintenance();
    expect(asset.nextMaintenanceDate!.getTime()).toBeGreaterThan(asset.lastMaintenanceDate!.getTime());
  });

  it('should validate next maintenance date is not in the past', () => {
    const asset = createAssetWithMaintenance();
    asset.nextMaintenanceDate = new Date('2020-01-01'); // Past date

    const errors = AssetEntity.validateAsset(asset);
    expect(errors).toContain('Data da próxima manutenção não pode ser no passado');
  });
});

describe('Depreciation Scenarios', () => {
  describe('Real-world asset depreciation', () => {
    it('should calculate depreciation for a vehicle (10 year useful life)', () => {
      const acquisitionValue = 80000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 3); // 3 years old

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        10
      );

      // After 3 years of 10 year useful life, ~70% value should remain
      expect(depreciatedValue).toBeGreaterThan(50000);
      expect(depreciatedValue).toBeLessThan(70000);
    });

    it('should calculate depreciation for electronics (3 year useful life)', () => {
      const acquisitionValue = 3000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 2); // 2 years old

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        3
      );

      // After 2 years of 3 year useful life, ~33% value should remain
      expect(depreciatedValue).toBeGreaterThan(500);
      expect(depreciatedValue).toBeLessThan(1500);
    });

    it('should calculate depreciation for furniture (7 year useful life)', () => {
      const acquisitionValue = 5000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 7); // 7 years old

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        7
      );

      // After 7 years of 7 year useful life, should be close to 0
      expect(depreciatedValue).toBeLessThanOrEqual(200);
    });

    it('should handle real estate with very long useful life', () => {
      const acquisitionValue = 1000000;
      const acquisitionDate = new Date();
      acquisitionDate.setFullYear(acquisitionDate.getFullYear() - 10); // 10 years old

      const depreciatedValue = AssetEntity.calculateDepreciation(
        acquisitionValue,
        acquisitionDate,
        50 // 50 years useful life for real estate
      );

      // After 10 years of 50 year useful life, ~80% value should remain
      expect(depreciatedValue).toBeGreaterThan(750000);
      expect(depreciatedValue).toBeLessThan(850000);
    });
  });
});
