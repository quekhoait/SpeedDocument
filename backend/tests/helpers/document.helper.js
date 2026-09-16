import { jest } from '@jest/globals';

export const setupDocumentMockEnvironment = async () => {
  // 1. External Third-party Libraries
  const mockAxios = {
    get: jest.fn().mockResolvedValue({ data: Buffer.from('mock-binary-data') }),
  };
  await jest.unstable_mockModule('axios', () => ({
    default: mockAxios,
    __esModule: true,
  }));

  const mockZipGenerate = jest.fn().mockReturnValue(Buffer.from('mock-docx-buffer'));
  const mockPizZipInstance = {};
  await jest.unstable_mockModule('pizzip', () => ({
    default: jest.fn().mockImplementation(() => mockPizZipInstance),
    __esModule: true,
  }));

  const mockDocxRender = jest.fn();
  await jest.unstable_mockModule('docxtemplater', () => ({
    default: jest.fn().mockImplementation(() => ({
      render: mockDocxRender,
      getZip: () => ({ generate: mockZipGenerate }),
    })),
    __esModule: true,
  }));

  const mockPdfPage = {
    drawRectangle: jest.fn(),
    drawImage: jest.fn(),
  };
  const mockPdfDoc = {
    embedPng: jest.fn().mockResolvedValue({}),
    getPages: jest.fn().mockReturnValue([mockPdfPage]),
    save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
  await jest.unstable_mockModule('pdf-lib', () => ({
    PDFDocument: {
      load: jest.fn().mockResolvedValue(mockPdfDoc),
    },
    rgb: jest.fn(() => ({})),
    __esModule: true,
  }));

  await jest.unstable_mockModule('libreoffice-convert', () => ({
    default: {
      convert: jest.fn((buf, ext, opt, cb) => cb(null, Buffer.from('mock-pdf-buffer'))),
    },
    __esModule: true,
  }));

  const mockCloudinary = {
    uploader: {
      upload: jest.fn(),
    },
  };
  await jest.unstable_mockModule('cloudinary', () => ({
    v2: mockCloudinary,
    __esModule: true,
  }));

  // 2. Project Services & AI Modules
  const mockCloudServices = {
    uploadToCloudinary: jest.fn().mockResolvedValue({
      secure_url: 'https://cloud.com/generated_file.pdf',
      public_id: 'file_id_1',
    }),
  };
  await jest.unstable_mockModule('../../src/services/CloudServices.js', () => ({
    default: mockCloudServices,
    __esModule: true,
  }));

  const mockTemplateServices = {
    getFieldByTemplateId: jest.fn().mockResolvedValue([
      { field_key: 'ho_ten', field_label: 'Họ tên', is_required: true },
    ]),
  };
  await jest.unstable_mockModule('../../src/services/TemplateServices.js', () => ({
    default: mockTemplateServices,
    __esModule: true,
  }));

  const mockPdfServices = {
    findTextCoordinates: jest.fn().mockResolvedValue({ pageIndex: 0, x: 100, y: 150 }),
  };
  await jest.unstable_mockModule('../../src/services/PdfServices.js', () => ({
    default: mockPdfServices,
    __esModule: true,
  }));

  const mockEmbedding = {
    generateLocalVector: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  };
  await jest.unstable_mockModule('../../src/utils/embedding.js', () => ({
    generateLocalVector: mockEmbedding.generateLocalVector,
    __esModule: true,
  }));

  const mockDocumentAIService = {
    analyzeDocumentRequest: jest.fn(),
    generateDocument: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/AIServices/documentService.js', () => ({
    analyzeDocumentRequest: mockDocumentAIService.analyzeDocumentRequest,
    generateDocument: mockDocumentAIService.generateDocument,
    __esModule: true,
  }));

  const mockRedisClient = {
    isOpen: false,
    get: jest.fn(),
    set: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/utils/redis.js', () => ({
    default: mockRedisClient,
    __esModule: true,
  }));

  // 3. Database & Models
  const mockSequelize = {
    literal: jest.fn((str) => str),
  };
  await jest.unstable_mockModule('../../src/config.js', () => ({
    default: mockSequelize,
    __esModule: true,
  }));

  const mockTemplate = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/TemplateModel.js', () => ({
    Template: mockTemplate,
    __esModule: true,
  }));

  const mockDocument = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/DocumentModel.js', () => ({
    default: mockDocument,
    __esModule: true,
  }));

  const mockUser = {
    findByPk: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/AuthModel.js', () => ({
    User: mockUser,
    __esModule: true,
  }));

  // 4. Dynamic Import Service
  const { default: documentServices, writeSignature } = await import('../../src/services/DocumentServices.js');

  return {
    documentServices,
    writeSignature,
    mocks: {
      mockAxios,
      mockDocxRender,
      mockZipGenerate,
      mockPdfDoc,
      mockPdfPage,
      mockCloudinary,
      mockCloudServices,
      mockTemplateServices,
      mockPdfServices,
      mockEmbedding,
      mockDocumentAIService,
      mockRedisClient,
      mockSequelize,
      mockTemplate,
      mockDocument,
      mockUser,
    },
  };
};