import { jest } from '@jest/globals';
import { setupDocumentMockEnvironment } from './helpers/document.helper.js';
import { documentTestData } from './fixtures/document.fixture.js';

const { documentServices, writeSignature, mocks } = await setupDocumentMockEnvironment();

const {
  getTemplateByPrompt,
  fillAndUploadTemplate,
  createDocumentWithTemplate,
  updateDocumentProgress,
  getDocumentByUserId,
  updateSignature,
  getDocumentById,
  getAllDocument,
} = documentServices;

const {
  mockAxios,
  mockDocxRender,
  mockCloudServices,
  mockCloudinary,
  mockPdfServices,
  mockDocumentAIService,
  mockTemplate,
  mockDocument,
  mockUser,
} = mocks;

describe('DocumentServices Unit Tests', () => {
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

  // ==========================================
  // getTemplateByPrompt()
  // ==========================================
  describe('getTemplateByPrompt()', () => {
    it('trả về NEED_DOCUMENT_TYPE nếu AI không nhận diện được loại văn bản', async () => {
      mockDocumentAIService.analyzeDocumentRequest.mockResolvedValue({
        isDocumentRequest: false,
      });

      const res = await getTemplateByPrompt('hôm nay trời đẹp quá');
      expect(res.status).toBe('NEED_DOCUMENT_TYPE');
    });

    it('trả về TEMPLATE_NOT_FOUND nếu không tìm thấy mẫu nào trong DB', async () => {
      mockDocumentAIService.analyzeDocumentRequest.mockResolvedValue(documentTestData.mockAnalysisSuccess);
      mockTemplate.findOne.mockResolvedValue(null);

      const res = await getTemplateByPrompt('làm đơn nghỉ việc');
      expect(res.status).toBe('TEMPLATE_NOT_FOUND');
    });

    it('trả về TEMPLATE_NOT_CONFIDENT nếu khoảng cách vector vượt ngưỡng MAX_DISTANCE (0.27)', async () => {
      mockDocumentAIService.analyzeDocumentRequest.mockResolvedValue({
        ...documentTestData.mockAnalysisSuccess,
        searchText: null,
      });
      mockTemplate.findOne.mockResolvedValue({
        id: 1,
        get: () => 0.45,
      });

      const res = await getTemplateByPrompt('tạo hợp đồng kinh tế');
      expect(res.status).toBe('TEMPLATE_NOT_CONFIDENT');
      expect(res.distance).toBe(0.45);
    });

    it('trả về OK khi khoảng cách vector nằm trong khoảng tin cậy', async () => {
      mockDocumentAIService.analyzeDocumentRequest.mockResolvedValue(documentTestData.mockAnalysisSuccess);
      mockTemplate.findOne.mockResolvedValue(documentTestData.templateRecord);

      const res = await getTemplateByPrompt('tạo đơn xin nghỉ phép');
      expect(res.status).toBe('OK');
      expect(res.templateId).toBe(1);
    });
  });

  // ==========================================
  // fillAndUploadTemplate()
  // ==========================================
  describe('fillAndUploadTemplate()', () => {
    it('ném lỗi nếu không tìm thấy template hoặc template không có file_path', async () => {
      mockTemplate.findByPk.mockResolvedValue(null);
      await expect(fillAndUploadTemplate(99)).rejects.toThrow(
        'Không tìm thấy Template hoặc đường dẫn file mẫu!'
      );
    });

    it('tải file mẫu docx, điền dữ liệu và upload lên cloudinary', async () => {
      mockTemplate.findByPk.mockResolvedValue(documentTestData.templateRecord);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({
        secure_url: 'https://cloud.com/filled.docx',
      });

      const res = await fillAndUploadTemplate(1, { '{{ho_ten}}': 'Nguyễn Văn A' });

      expect(mockAxios.get).toHaveBeenCalledWith(documentTestData.templateRecord.file_path, {
        responseType: 'arraybuffer',
      });
      expect(mockDocxRender).toHaveBeenCalledWith(
        expect.objectContaining({
          ho_ten: 'Nguyễn Văn A',
          chu_ky_nguoi_viet: '',
        })
      );
      expect(res.cloudUrl).toBe('https://cloud.com/filled.docx');
    });
  });

  // ==========================================
  // createDocumentWithTemplate()
  // ==========================================
  describe('createDocumentWithTemplate()', () => {
    it('ném lỗi nếu không tìm thấy template', async () => {
      mockTemplate.findByPk.mockResolvedValue(null);
      await expect(createDocumentWithTemplate(99, 'tạo đơn')).rejects.toThrow('Template không tồn tại');
    });

    it('tạo văn bản nháp (status: false) nếu AI thông báo chưa đủ thông tin', async () => {
      mockTemplate.findByPk.mockResolvedValue(documentTestData.templateRecord);
      mockDocumentAIService.generateDocument.mockResolvedValue(documentTestData.mockAiIncomplete);
      mockDocument.create.mockResolvedValue({ id: 10 });

      const res = await createDocumentWithTemplate(1, 'tôi muốn nghỉ phép', 1);

      expect(mockDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          missing_fields: ['ly_do'],
        })
      );
      expect(res.isComplete).toBe(false);
      expect(res.message).toBe('Lý do bạn xin nghỉ là gì?');
    });

    it('tạo và render văn bản hoàn tất (status: true) khi AI đã đủ thông tin', async () => {
      mockTemplate.findByPk.mockResolvedValue(documentTestData.templateRecord);
      mockDocumentAIService.generateDocument.mockResolvedValue(documentTestData.mockAiComplete);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({
        secure_url: 'https://cloud.com/done.docx',
      });
      mockDocument.create.mockResolvedValue({ id: 11 });

      const res = await createDocumentWithTemplate(1, 'nghỉ vì bị ốm', 1);

      expect(mockDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          file_path: 'https://cloud.com/done.docx',
        })
      );
      expect(res.isComplete).toBe(true);
      expect(res.message).toBe('Đã thu thập đủ thông tin để tạo văn bản!');
    });
  });

  // ==========================================
  // updateDocumentProgress()
  // ==========================================
  describe('updateDocumentProgress()', () => {
    it('ném lỗi nếu không tìm thấy document', async () => {
      mockDocument.findByPk.mockResolvedValue(null);
      await expect(updateDocumentProgress(99, 1, 'nốt lý do')).rejects.toThrow(
        'Không tìm thấy bản nháp tài liệu!'
      );
    });

    it('cập nhật thêm thông tin cho văn bản đang hoàn thiện', async () => {
      const mockUpdate = jest.fn();
      mockDocument.findByPk.mockResolvedValue({
        ...documentTestData.documentRecord,
        update: mockUpdate,
      });
      mockTemplate.findByPk.mockResolvedValue(documentTestData.templateRecord);
      mockDocumentAIService.generateDocument.mockResolvedValue(documentTestData.mockAiComplete);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({
        secure_url: 'https://cloud.com/finished.docx',
      });

      const res = await updateDocumentProgress(10, 1, 'bị sốt xuất huyết');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          file_path: 'https://cloud.com/finished.docx',
        })
      );
      expect(res.isComplete).toBe(true);
    });
  });

  // ==========================================
  // writeSignature()
  // ==========================================
  describe('writeSignature()', () => {
    it('ném lỗi nếu không tìm thấy document', async () => {
      mockDocument.findByPk.mockResolvedValue(null);
      await expect(writeSignature(1, 99)).rejects.toThrow('Không tìm thấy tài liệu!');
    });

    it('ném lỗi nếu không tìm thấy template liên kết với tài liệu', async () => {
      mockDocument.findByPk.mockResolvedValue(documentTestData.documentRecord);
      mockTemplate.findByPk.mockResolvedValue(null);

      await expect(writeSignature(1, 10)).rejects.toThrow('Không tìm thấy Template hoặc file mẫu!');
    });

    it('ký số thành công, chèn ảnh chữ ký vào PDF và update đường dẫn', async () => {
      const mockDocUpdate = jest.fn();
      mockDocument.findByPk.mockResolvedValue({
        ...documentTestData.documentRecord,
        update: mockDocUpdate,
      });
      mockTemplate.findByPk.mockResolvedValue(documentTestData.templateRecord);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({
        secure_url: 'https://cloud.com/signed.pdf',
      });

      const res = await writeSignature(1, 10);

      expect(mockPdfServices.findTextCoordinates).toHaveBeenCalled();
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          file_path: 'https://cloud.com/signed.pdf',
        })
      );
      expect(res.cloudUrl).toBe('https://cloud.com/signed.pdf');
    });
  });

  // ==========================================
  // updateSignature()
  // ==========================================
  describe('updateSignature()', () => {
    it('ném lỗi nếu không có cả signature mới lẫn signature người dùng', async () => {
      mockUser.findByPk.mockResolvedValue({ signature: null });
      mockDocument.findByPk.mockResolvedValue(documentTestData.documentRecord);

      await expect(updateSignature(1, 10, null)).rejects.toThrow(
        'Lưu chữ ký thất bại: Không tìm thấy dữ liệu chữ ký (Base64)!'
      );
    });

    it('ném lỗi nếu document không thuộc về userId được cung cấp', async () => {
      mockUser.findByPk.mockResolvedValue(documentTestData.userRecord);
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloud.com/new-sig.png',
        public_id: 'sig_pub_1',
      });
      mockDocument.findByPk.mockResolvedValue({
        ...documentTestData.documentRecord,
        user_id: 999, // mismatch
      });

      await expect(
        updateSignature(1, 10, documentTestData.validSignatureBase64)
      ).rejects.toThrow('Lưu chữ ký thất bại: Tài liệu không hợp lệ');
    });

    it('upload signature mới và gán vào document khi có signature truyền lên', async () => {
      const mockDocSave = jest.fn();
      mockUser.findByPk.mockResolvedValue(documentTestData.userRecord);
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloud.com/sig-uploaded.png',
        public_id: 'sig_id',
      });
      mockDocument.findByPk.mockResolvedValue({
        ...documentTestData.documentRecord,
        save: mockDocSave,
      });

      const res = await updateSignature(1, 10, documentTestData.validSignatureBase64);

      expect(res.status).toBe('OK');
      expect(mockDocSave).toHaveBeenCalled();
    });

    it('lấy lại signature có sẵn của user khi không gửi signature mới', async () => {
      const mockDocSave = jest.fn();
      mockUser.findByPk.mockResolvedValue(documentTestData.userRecord);
      mockDocument.findByPk.mockResolvedValue({
        ...documentTestData.documentRecord,
        save: mockDocSave,
      });

      const res = await updateSignature(1, 10, null);

      expect(res.status).toBe('OK');
      expect(mockDocSave).toHaveBeenCalled();
    });
  });

  // ==========================================
  // getDocumentById(), getDocumentByUserId(), getAllDocument()
  // ==========================================
  describe('Query Document Methods', () => {
    it('getDocumentById() ném lỗi nếu không tìm thấy văn bản', async () => {
      mockDocument.findOne.mockResolvedValue(null);
      await expect(getDocumentById(99)).rejects.toThrow(
        'Văn bản không tồn tại hoặc bạn không có quyền truy cập.'
      );
    });

    it('getDocumentById() trả về document kèm include khi hợp lệ', async () => {
      mockDocument.findOne.mockResolvedValue(documentTestData.documentRecord);
      const res = await getDocumentById(10, 1);
      expect(res.id).toBe(10);
    });

    it('getDocumentByUserId() lấy danh sách document của người dùng', async () => {
      mockDocument.findAll.mockResolvedValue([documentTestData.documentRecord]);
      const res = await getDocumentByUserId(1);
      expect(res).toHaveLength(1);
    });

    it('getAllDocument() lấy toàn bộ danh sách tài liệu', async () => {
      mockDocument.findAll.mockResolvedValue([documentTestData.documentRecord]);
      const res = await getAllDocument();
      expect(res).toHaveLength(1);
    });
  });
});