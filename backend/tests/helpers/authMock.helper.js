import { jest } from '@jest/globals';

export const setupAuthMockEnvironment = async () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/utils/cache.js', () => ({
    default: mockCache,
    myCache: mockCache,
    __esModule: true,
  }));

  const mockSendMail = jest.fn();
  await jest.unstable_mockModule('nodemailer', () => ({
    default: {
      createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
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

  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
  };
  const mockAuthMethod = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockRefreshToken = {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  };
  await jest.unstable_mockModule('../../src/models/AuthModel.js', () => ({
    User: mockUser,
    AuthMethod: mockAuthMethod,
    RefreshToken: mockRefreshToken,
    __esModule: true,
  }));

  const { default: authServices } = await import('../../src/services/AuthServices.js');

  return {
    authServices,
    mocks: {
      mockCache,
      mockSendMail,
      mockCloudinary,
      mockUser,
      mockAuthMethod,
      mockRefreshToken,
    },
  };
};