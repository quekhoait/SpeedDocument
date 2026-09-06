import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { setupAuthMockEnvironment } from './helpers/authMock.helper.js';
import { authTestData } from './fixtures/auth.fixture.js';

const { authServices, mocks } = await setupAuthMockEnvironment();

const {
  verifyOTP,
  sendOTPEmail,
  createUser,
  loginUser,
  getUserById,
  saveRefreshToken,
  getRefreshToken,
  logoutUser,
  saveSignature,
  updateUser,
  getAllUser,
  findOrCreateGoogleUser,
} = authServices;

const { mockCache, mockSendMail, mockCloudinary, mockUser, mockAuthMethod, mockRefreshToken } =
  mocks;

describe('AuthServices Unit Tests', () => {
  let consoleSpy;
    beforeAll(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
  
    afterAll(() => {
      consoleSpy.mockRestore();
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyOTP()', () => {
    test.each([
      ['hết hạn hoặc không tồn tại trong cache', null, '123456'],
      ['người dùng nhập sai mã', '654321', '123456'],
    ])('trả về ERR khi OTP %s', (_, cachedOtp, inputOtp) => {
      mockCache.get.mockReturnValue(cachedOtp);
      const result = verifyOTP('test@example.com', inputOtp);

      expect(result.status).toBe('ERR');
      expect(result.message).toBe('OTP sai hoặc đã hết hạn!');
    });

    it('xác thực thành công và xóa cache', () => {
      mockCache.get.mockReturnValue('123456');
      const result = verifyOTP('test@example.com', '123456');

      expect(result.status).toBe('OK');
      expect(mockCache.del).toHaveBeenCalledWith('otp_test@example.com');
    });
  });

  describe('sendOTPEmail()', () => {
    it('trả về ERR nếu email đã được đăng ký', async () => {
      mockUser.findOne.mockResolvedValue(authTestData.validUser);
      const result = await sendOTPEmail(authTestData.validUser.email);

      expect(result).toEqual({ status: 'ERR', message: 'Email đã được đăng ký' });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('tạo mã OTP, lưu cache và gửi mail thành công', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockSendMail.mockResolvedValue(true);

      await sendOTPEmail('test@example.com');

      expect(mockCache.set).toHaveBeenCalledWith(
        'otp_test@example.com',
        expect.stringMatching(/^\d{6}$/)
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Mã xác thực OTP của bạn',
        })
      );
    });
  });

  describe('createUser()', () => {
    it('trả về ERR khi username đã tồn tại', async () => {
      mockUser.findOne.mockResolvedValue({ id: 1, username: 'newuser' });
      const result = await createUser(authTestData.newUserPayload);

      expect(result).toEqual({ status: 'ERR', message: 'Username đã tồn tại' });
      expect(mockUser.create).not.toHaveBeenCalled();
    });

    it('tạo mới user và auth method thành công', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        id: 1,
        ...authTestData.newUserPayload,
        role: 'user',
      });

      const result = await createUser(authTestData.newUserPayload);

      expect(result.status).toBe('OK');
      expect(result.user.username).toBe(authTestData.newUserPayload.username);
      expect(mockAuthMethod.create).toHaveBeenCalledWith({
        user_id: 1,
        provider: 'local',
        providerId: authTestData.newUserPayload.email,
      });
    });
  });

  describe('loginUser()', () => {
    it('trả về ERR nếu email không tồn tại', async () => {
      mockUser.findOne.mockResolvedValue(null);
      const result = await loginUser({ email: 'unknown@test.com', password: '123' });

      expect(result).toEqual({ status: 'ERR', message: 'Email hoặc mật khẩu không đúng' });
    });

    it('trả về ERR nếu sai mật khẩu', async () => {
      const hash = bcrypt.hashSync('correct-pass', 10);
      mockUser.findOne.mockResolvedValue({ email: 'user@test.com', password: hash });

      const result = await loginUser({ email: 'user@test.com', password: 'wrong-pass' });
      expect(result).toEqual({ status: 'ERR', message: 'Mật khẩu không đúng' });
    });

    it('đăng nhập thành công với mật khẩu đúng', async () => {
      const hash = bcrypt.hashSync(authTestData.loginPayload.password, 10);
      mockUser.findOne.mockResolvedValue({
        ...authTestData.validUser,
        password: hash,
      });

      const result = await loginUser(authTestData.loginPayload);

      expect(result.status).toBe('OK');
      expect(result.message).toBe('Đăng nhập thành công');
      expect(result.user.id).toBe(authTestData.validUser.id);
    });
  });

  describe('getUserById()', () => {
    it('trả về ERR khi không tìm thấy user', async () => {
      mockUser.findByPk.mockResolvedValue(null);
      const result = await getUserById(99);
      expect(result).toEqual({ status: 'ERR', message: 'User not found' });
    });

    it('trả về OK và data user khi tìm thấy', async () => {
      mockUser.findByPk.mockResolvedValue(authTestData.validUser);
      const result = await getUserById(1);
      expect(result.status).toBe('OK');
      expect(result.user.id).toBe(1);
    });
  });

  describe('RefreshToken helpers', () => {
    it('saveRefreshToken() lưu token vào database', async () => {
      mockRefreshToken.create.mockResolvedValue({ user_id: 1, refreshToken: 'token_abc' });
      const result = await saveRefreshToken(1, 'token_abc');

      expect(mockRefreshToken.create).toHaveBeenCalledWith({
        user_id: 1,
        refreshToken: 'token_abc',
      });
      expect(result.refreshToken).toBe('token_abc');
    });

    it('getRefreshToken() tìm kiếm đúng token', async () => {
      mockRefreshToken.findOne.mockResolvedValue({ refreshToken: 'token_abc' });
      const result = await getRefreshToken('token_abc');

      expect(mockRefreshToken.findOne).toHaveBeenCalledWith({ where: { refreshToken: 'token_abc' } });
      expect(result.refreshToken).toBe('token_abc');
    });

    it('logoutUser() xóa token khỏi DB', async () => {
      mockRefreshToken.destroy.mockResolvedValue(1);
      const result = await logoutUser('token_abc');

      expect(mockRefreshToken.destroy).toHaveBeenCalledWith({ where: { refreshToken: 'token_abc' } });
      expect(result).toBe(1);
    });
  });

  describe('saveSignature()', () => {
    it('ném lỗi nếu không có dữ liệu signature', async () => {
      await expect(saveSignature(1, null)).rejects.toThrow(
        'Lưu chữ ký thất bại: Không tìm thấy dữ liệu chữ ký (Base64)!'
      );
    });

    it('ném lỗi nếu không tìm thấy người dùng', async () => {
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/sig.png',
        public_id: 'sig_123',
      });
      mockUser.findByPk.mockResolvedValue(null);

      await expect(saveSignature(99, authTestData.validSignatureBase64)).rejects.toThrow(
        'Lưu chữ ký thất bại: Người dùng không tồn tại!'
      );
    });

    it('upload cloudinary và lưu chữ ký thành công', async () => {
      const mockSave = jest.fn();
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/sig.png',
        public_id: 'sig_123',
      });
      mockUser.findByPk.mockResolvedValue({ id: 1, save: mockSave });

      const result = await saveSignature(1, authTestData.validSignatureBase64);

      expect(result.status).toBe('OK');
      expect(result.signature.url).toBe('https://cloudinary.com/sig.png');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('updateUser()', () => {
    it('ném lỗi nếu không tìm thấy user', async () => {
      mockUser.findByPk.mockResolvedValue(null);
      await expect(updateUser(99, {})).rejects.toThrow('User not found');
    });

    it('cập nhật thông tin và avatar thành công', async () => {
      const mockUpdate = jest.fn();
      mockUser.findByPk.mockResolvedValue({ id: 1, update: mockUpdate });

      await updateUser(1, { fullname: 'New Name', avatar: 'https://avatar.url' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fullname: 'New Name',
          avatar: 'https://avatar.url',
        })
      );
    });
  });

  describe('getAllUser()', () => {
    it('trả về ERROR nếu người gọi không phải admin', async () => {
      mockUser.findByPk.mockResolvedValue(authTestData.validUser);
      const result = await getAllUser(authTestData.validUser.id);

      expect(result).toEqual({ status: 'ERROR', message: 'Bạn không có quyền truy cập!' });
      expect(mockUser.findAll).not.toHaveBeenCalled();
    });

    it('lấy danh sách users nếu là admin', async () => {
      mockUser.findByPk.mockResolvedValue(authTestData.adminUser);
      mockUser.findAll.mockResolvedValue([authTestData.adminUser]);

      const result = await getAllUser(authTestData.adminUser.id);

      expect(result.status).toBe('OK');
      expect(result.data).toHaveLength(1);
      expect(mockUser.findAll).toHaveBeenCalledWith({
        attributes: { exclude: ['password'] },
      });
    });
  });

  describe('findOrCreateGoogleUser()', () => {
    it('ném lỗi nếu email đã tồn tại nhưng chưa liên kết google provider', async () => {
      mockUser.findOne.mockResolvedValue({ id: 1, email: 'google@test.com' });
      mockAuthMethod.findOne.mockResolvedValue(null);

      await expect(
        findOrCreateGoogleUser({ googleId: '123', email: 'google@test.com' })
      ).rejects.toThrow('Email này đã được đăng ký bằng mật khẩu thông thường');
    });

    it('cập nhật avatar và trả về user nếu user google đã tồn tại', async () => {
      const mockSave = jest.fn();
      mockUser.findOne.mockResolvedValue({
        id: 1,
        email: 'google@test.com',
        avatar: null,
        save: mockSave,
      });
      mockAuthMethod.findOne.mockResolvedValue({ id: 1, provider: 'google' });

      const user = await findOrCreateGoogleUser({
        googleId: '123',
        email: 'google@test.com',
        avatar: 'https://new-avatar.png',
      });

      expect(user.avatar).toBe('https://new-avatar.png');
      expect(mockSave).toHaveBeenCalled();
    });

    it('tạo mới user và auth method google nếu chưa tồn tại', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({ id: 10, email: authTestData.googleUserPayload.email });

      const user = await findOrCreateGoogleUser(authTestData.googleUserPayload);

      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: authTestData.googleUserPayload.email,
          role: 'user',
        })
      );
      expect(mockAuthMethod.create).toHaveBeenCalledWith({
        user_id: 10,
        provider: 'google',
        providerId: authTestData.googleUserPayload.googleId,
      });
      expect(user.id).toBe(10);
    });
  });
});