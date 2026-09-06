import { jest } from '@jest/globals';

export const setupTemplateMockEnvironment = async () => {
  const mockMammoth = {
    extractRawText: jest.fn(),
  };
  await jest.unstable_mockModule('mammoth', () => ({
    default: mockMammoth,
    __esModule: true,
  }));

  const mockCloudServices = {
    uploadToCloudinary: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/services/CloudServices.js', () => ({
    default: mockCloudServices,
    __esModule: true,
  }));

  const mockEmbedding = {
    generateLocalVector: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/utils/embedding.js', () => ({
    generateLocalVector: mockEmbedding.generateLocalVector,
    __esModule: true,
  }));

  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };
  const mockSequelize = {
    transaction: jest.fn(() => Promise.resolve(mockTransaction)),
  };
  await jest.unstable_mockModule('../../src/config.js', () => ({
    default: mockSequelize,
    __esModule: true,
  }));

  const mockTemplateCategory = {
    create: jest.fn(),
    findAll: jest.fn(),
  };
  const mockTemplate = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
  };
  const mockTemplateField = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  };
  const mockTemplateFieldMapping = {
    create: jest.fn(),
    destroy: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/TemplateModel.js', () => ({
    TemplateCategory: mockTemplateCategory,
    Template: mockTemplate,
    TemplateField: mockTemplateField,
    TemplateFieldMapping: mockTemplateFieldMapping,
    __esModule: true,
  }));

  const mockDocument = {
    count: jest.fn(),
    update: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/DocumentModel.js', () => ({
    default: mockDocument,
    __esModule: true,
  }));

  const { default: templateServices } = await import('../../src/services/TemplateServices.js');

  return {
    templateServices,
    mocks: {
      mockMammoth,
      mockCloudServices,
      mockEmbedding,
      mockTransaction,
      mockSequelize,
      mockTemplateCategory,
      mockTemplate,
      mockTemplateField,
      mockTemplateFieldMapping,
      mockDocument,
    },
  };
};