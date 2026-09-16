import { jest } from '@jest/globals';
import { setupTemplateMockEnvironment } from './helpers/templateMock.helper.js';
import { templateTestData } from './fixtures/template.fixture.js';

const { templateServices, mocks } = await setupTemplateMockEnvironment();

const {
  createCategoryTemplate,
  getAllCategory,
  getTemplates,
  getTemplate,
  getAllTemplate,
  getFieldTemplate,
  previewFieldsFromWord,
  getTemplateById,
  createTemplate,
  updateField,
  getFieldByTemplateId,
  removeSoftTemplate,
  updateTemplate,
} = templateServices;

const {
  mockMammoth,
  mockCloudServices,
  mockEmbedding,
  mockTransaction,
  mockTemplateCategory,
  mockTemplate,
  mockTemplateField,
  mockTemplateFieldMapping,
  mockDocument,
} = mocks;

describe('TemplateServices Unit Tests - 100% Coverage', () => {
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

  describe('Category Methods', () => {
    it('createCategoryTemplate() tạo danh mục mới', async () => {
      mockTemplateCategory.create.mockResolvedValue(templateTestData.category);
      const res = await createCategoryTemplate(templateTestData.category);

      expect(mockTemplateCategory.create).toHaveBeenCalledWith({
        name: templateTestData.category.name,
        description: templateTestData.category.description,
      });
      expect(res.id).toBe(templateTestData.category.id);
    });

    it('getAllCategory() trả về tất cả danh mục', async () => {
      mockTemplateCategory.findAll.mockResolvedValue([templateTestData.category]);
      const res = await getAllCategory();
      expect(res).toHaveLength(1);
    });
  });


  describe('Query Template Methods', () => {
    it('getTemplates() lấy tất cả template active khi không truyền cateId và kw', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getTemplates();

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_active: true },
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getTemplates() lọc theo categoryId khi chỉ truyền cateId', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getTemplates(1);

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
            template_category_id: 1,
          }),
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getTemplates() lọc theo keyword và trim khoảng trắng khi chỉ truyền kw', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getTemplates(null, '   đơn   ');

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
            name: expect.any(Object),
          }),
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getTemplates() lọc kết hợp cả categoryId và keyword', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getTemplates(1, 'đơn');

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
            template_category_id: 1,
            name: expect.any(Object),
          }),
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getTemplate() tìm theo id kèm association', async () => {
      mockTemplate.findByPk.mockResolvedValue(templateTestData.templateRecord);
      const res = await getTemplate(1);

      expect(mockTemplate.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.id).toBe(1);
    });

    it('getTemplateById() tìm theo id kèm category và fieldMappings', async () => {
      mockTemplate.findByPk.mockResolvedValue({ id: 10, name: 'Template 10' });
      const res = await getTemplateById(10);

      expect(mockTemplate.findByPk).toHaveBeenCalledWith(10, expect.any(Object));
      expect(res.id).toBe(10);
    });

    it('getAllTemplate() lấy danh sách với condition rỗng khi không truyền cateId và kw', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getAllTemplate();

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(res).toHaveLength(1);
    });

    it('getAllTemplate() lọc theo categoryId khi chỉ truyền cateId', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getAllTemplate(1);

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            template_category_id: 1,
          }),
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getAllTemplate() lọc theo keyword và trim khoảng trắng khi chỉ truyền kw', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getAllTemplate(null, '   đơn   ');

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
        })
      );
      expect(res).toHaveLength(1);
    });

    it('getAllTemplate() lọc kết hợp cả categoryId và keyword', async () => {
      mockTemplate.findAll.mockResolvedValue([templateTestData.templateRecord]);
      const res = await getAllTemplate(1, 'đơn');

      expect(mockTemplate.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            template_category_id: 1,
            name: expect.any(Object),
          }),
        })
      );
      expect(res).toHaveLength(1);
    });
  });


  describe('Word Parsing & Extraction', () => {
    it('getFieldTemplate() ném lỗi nếu không truyền input', async () => {
      await expect(getFieldTemplate(null)).rejects.toThrow('Không có file để đọc');
    });

    it('getFieldTemplate() trích xuất placeholders qua Buffer', async () => {
      mockMammoth.extractRawText.mockResolvedValue({
        value: 'Họ và tên: {{ho_ten}}, Mã số: {{ma_so}}, Lặp lại: {{ho_ten}}',
      });

      const buffer = Buffer.from('mock');
      const res = await getFieldTemplate(buffer);

      expect(mockMammoth.extractRawText).toHaveBeenCalledWith({ buffer });
      expect(res).toEqual(['ho_ten', 'ma_so']);
    });

    it('getFieldTemplate() trích xuất qua File Path và xử lý giá trị trả về rỗng', async () => {
      mockMammoth.extractRawText.mockResolvedValue({ value: null });
      const res = await getFieldTemplate('/path/to/empty.docx');

      expect(mockMammoth.extractRawText).toHaveBeenCalledWith({ path: '/path/to/empty.docx' });
      expect(res).toEqual([]);
    });

    it('getFieldTemplate() trích xuất placeholders từ chuỗi file path', async () => {
      mockMammoth.extractRawText.mockResolvedValue({ value: 'Chữ ký: {{chu_ky}}' });
      const res = await getFieldTemplate('/path/to/file.docx');

      expect(mockMammoth.extractRawText).toHaveBeenCalledWith({ path: '/path/to/file.docx' });
      expect(res).toEqual(['chu_ky']);
    });

    it('previewFieldsFromWord() map đúng trường tồn tại và chưa tồn tại', async () => {
      mockMammoth.extractRawText.mockResolvedValue({ value: '{{field_old}} {{field_new}}' });
      mockTemplateField.findAll.mockResolvedValue([
        { field_key: 'field_old', field_label: 'Trường cũ', field_type: 'text' },
      ]);

      const res = await previewFieldsFromWord('dummy.docx');

      expect(res).toEqual([
        { field_key: 'field_old', field_label: 'Trường cũ', field_type: 'text', is_existing: true },
        { field_key: 'field_new', field_label: 'field_new', field_type: 'text', is_existing: false },
      ]);
    });

    it('previewFieldsFromWord() trả về mảng rỗng nếu không có trường nào', async () => {
      mockMammoth.extractRawText.mockResolvedValue({ value: 'Không có placeholder' });
      const res = await previewFieldsFromWord('empty.docx');
      expect(res).toEqual([]);
    });
  });


  describe('createTemplate()', () => {
    it('ném lỗi nếu thiếu cả fileBuffer và urlCloud', async () => {
      await expect(createTemplate({ name: 'Test' })).rejects.toThrow(
        'Thiếu fileBuffer hoặc urlCloud để tạo template.'
      );
    });

   it('ném lỗi nếu name đã có trong cùng category', async () => {
      mockCloudServices.uploadToCloudinary.mockResolvedValue({
        secure_url: 'https://cloud.com/dummy.docx',
      });
      mockTemplate.findOne.mockResolvedValue({
        id: 1,
        name: templateTestData.createPayload.name,
      });
      await expect(createTemplate(templateTestData.createPayload)).rejects.toThrow(
        `Template với tên "${templateTestData.createPayload.name}" đã tồn tại trong danh mục này.`
      );
    });

    it('upload file lên cloud, tạo vector, tạo field mới và liên kết documentId', async () => {
      mockTemplate.findOne.mockResolvedValue(null);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({ secure_url: 'https://cloud.com/doc.docx' });
      mockEmbedding.generateLocalVector.mockResolvedValue([0.1, 0.2, 0.3]);
      mockTemplate.create.mockResolvedValue({ id: 100 });
      mockTemplateField.findOne.mockResolvedValue(null);
      mockTemplateField.create.mockResolvedValue({ id: 50 });
      mockTemplate.findByPk.mockResolvedValue({ id: 100, name: templateTestData.createPayload.name });

      const res = await createTemplate(templateTestData.createPayload);

      expect(mockCloudServices.uploadToCloudinary).toHaveBeenCalledWith(
        templateTestData.createPayload.fileBuffer,
        templateTestData.createPayload.fileName
      );
      expect(mockTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: templateTestData.createPayload.name,
          file_path: 'https://cloud.com/doc.docx',
          template_vector: [0.1, 0.2, 0.3],
          user_id: templateTestData.createPayload.userId,
        }),
        { transaction: mockTransaction }
      );
      expect(mockTemplateField.create).toHaveBeenCalledTimes(1);
      expect(mockTemplateFieldMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: 100,
          template_fields_id: 50,
          placeholder: '{{ten_kh}}',
          is_required: true,
        }),
        { transaction: mockTransaction }
      );
      expect(mockDocument.update).toHaveBeenCalledWith(
        { template_id: 100 },
        { where: { id: 99 }, transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.id).toBe(100);
    });

    it('sử dụng urlCloud có sẵn, tái sử dụng fieldObj đã tồn tại và không truyền documentId', async () => {
      mockTemplate.findOne.mockResolvedValue(null);
      mockEmbedding.generateLocalVector.mockResolvedValue([0.1, 0.2]);
      mockTemplate.create.mockResolvedValue({ id: 101 });
      mockTemplateField.findOne.mockResolvedValue({ id: 77, field_key: 'field_co_san' });
      mockTemplate.findByPk.mockResolvedValue({ id: 101 });

      const payload = {
        name: 'Template URL',
        description: 'Mô tả URL',
        categoryId: 2,
        urlCloud: 'https://cloud.com/available.docx',
        fields: [{ field_key: 'field_co_san', field_label: 'Có sẵn' }],
      };

      const res = await createTemplate(payload);

      expect(mockCloudServices.uploadToCloudinary).not.toHaveBeenCalled();
      expect(mockTemplateField.create).not.toHaveBeenCalled();
      expect(mockTemplateFieldMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: 101,
          template_fields_id: 77,
          placeholder: '{{field_co_san}}',
          is_required: false,
        }),
        { transaction: mockTransaction }
      );
      expect(mockDocument.update).not.toHaveBeenCalled();
      expect(res.id).toBe(101);
    });

    it('tạo template không có fields (fields rỗng)', async () => {
      mockTemplate.findOne.mockResolvedValue(null);
      mockEmbedding.generateLocalVector.mockResolvedValue([0.5]);
      mockTemplate.create.mockResolvedValue({ id: 102 });
      mockTemplate.findByPk.mockResolvedValue({ id: 102 });

      const res = await createTemplate({
        name: 'Template No Field',
        description: 'Mô tả',
        categoryId: 1,
        urlCloud: 'https://cloud.com/no-field.docx',
        fields: [],
      });

      expect(mockTemplateField.findOne).not.toHaveBeenCalled();
      expect(mockTemplateFieldMapping.create).not.toHaveBeenCalled();
      expect(res.id).toBe(102);
    });

    it('rollback transaction khi gặp lỗi', async () => {
      mockTemplate.findOne.mockResolvedValue(null);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({ secure_url: 'https://cloud.com/doc.docx' });
      mockEmbedding.generateLocalVector.mockRejectedValue(new Error('AI Service Error'));

      await expect(createTemplate(templateTestData.createPayload)).rejects.toThrow('AI Service Error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('updateField()', () => {
    it('trả về ERR nếu không tìm thấy field', async () => {
      mockTemplateField.findByPk.mockResolvedValue(null);
      const res = await updateField({ id: 1 });
      expect(res).toEqual({ status: 'ERR', message: 'Không tìm thấy trường dữ liệu (Field) này' });
    });

    it('trả về ERR nếu không có thay đổi nào', async () => {
      mockTemplateField.findByPk.mockResolvedValue(templateTestData.fieldRecord);

      const res = await updateField(templateTestData.fieldRecord);
      expect(res).toEqual({ status: 'ERR', message: 'Bạn chưa thay đổi gì cả!!' });
    });

    it('cập nhật field thành công và giữ lại các giá trị cũ nếu không truyền đủ', async () => {
      const mockUpdate = jest.fn();
      mockTemplateField.findByPk.mockResolvedValue({
        ...templateTestData.fieldRecord,
        update: mockUpdate,
      });

      const res = await updateField({ id: 10, field_label: 'Label Mới' });
      expect(mockUpdate).toHaveBeenCalledWith({
        field_key: 'key1',
        field_label: 'Label Mới',
        field_type: 'text',
      });
      expect(res.status).toBe('OK');
    });
  });


  describe('getFieldByTemplateId()', () => {
    it('trả về mảng rỗng nếu không tìm thấy template', async () => {
      mockTemplate.findByPk.mockResolvedValue(null);
      const res = await getFieldByTemplateId(999);
      expect(res).toEqual([]);
    });

    it('lọc bỏ các placeholder chữ ký (chu_ky) thành công', async () => {
      mockTemplate.findByPk.mockResolvedValue({
        fieldMappings: [
          {
            placeholder: '{{ten}}',
            is_required: true,
            field: { field_key: 'ten', field_label: 'Tên', field_type: 'text' },
          },
          {
            placeholder: '{{chu_ky_giam_doc}}',
            is_required: false,
            field: { field_key: 'sign', field_label: 'Ký', field_type: 'image' },
          },
        ],
      });

      const res = await getFieldByTemplateId(1);
      expect(res).toHaveLength(1);
      expect(res[0].field_key).toBe('ten');
    });
  });


  describe('removeSoftTemplate()', () => {
    it('ném lỗi nếu template không tồn tại', async () => {
      mockTemplate.findByPk.mockResolvedValue(null);
      await expect(removeSoftTemplate(99)).rejects.toThrow('Template with id 99 not found');
    });

    it('soft delete (is_active = false) nếu template đã có document ràng buộc', async () => {
      const mockSave = jest.fn();
      mockTemplate.findByPk.mockResolvedValue({ id: 1, is_active: true, save: mockSave });
      mockDocument.count.mockResolvedValue(3);

      const res = await removeSoftTemplate(1);
      expect(mockSave).toHaveBeenCalled();
      expect(res.is_active).toBe(false);
    });

    it('xóa vĩnh viễn (destroy) nếu template chưa có document nào', async () => {
      const mockDestroy = jest.fn();
      mockTemplate.findByPk.mockResolvedValue({ id: 1, destroy: mockDestroy });
      mockDocument.count.mockResolvedValue(0);

      const res = await removeSoftTemplate(1);
      expect(mockDestroy).toHaveBeenCalled();
      expect(res).toEqual({ message: 'Template deleted permanently', id: 1 });
    });
  });


  describe('updateTemplate()', () => {
    it('ném lỗi nếu không tìm thấy template', async () => {
      mockTemplate.findByPk.mockResolvedValue(null);
      await expect(updateTemplate(99, {})).rejects.toThrow('Template with id 99 not found');
    });

    it('ném lỗi nếu tên mới bị trùng trong cùng danh mục', async () => {
      mockTemplate.findByPk.mockResolvedValue(templateTestData.templateRecord);
      mockTemplate.findOne.mockResolvedValue({ id: 2, name: 'Tên mới trùng' });

      await expect(
        updateTemplate(1, { name: 'Tên mới trùng', categoryId: 1 })
      ).rejects.toThrow('Template với tên "Tên mới trùng" đã tồn tại trong danh mục này.');
    });

    it('cập nhật file bằng urlCloud, tạo mới field khi field chưa tồn tại', async () => {
      const mockInstance = {
        ...templateTestData.templateRecord,
        update: jest.fn(),
      };
      mockTemplate.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce({ id: 1, name: 'Template Cập Nhật' });

      mockTemplate.findOne.mockResolvedValue(null);
      mockEmbedding.generateLocalVector.mockResolvedValue([0.8, 0.9]);
      mockTemplateField.findOne.mockResolvedValue(null);
      mockTemplateField.create.mockResolvedValue({ id: 88 });

      const res = await updateTemplate(1, {
        name: 'Template Cập Nhật',
        urlCloud: 'https://cloud.com/updated.docx',
        fields: [{ field_key: 'field_brand_new', field_type: 'number' }],
      });

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          file_path: 'https://cloud.com/updated.docx',
        }),
        { transaction: mockTransaction }
      );
      expect(mockTemplateField.create).toHaveBeenCalledWith(
        expect.objectContaining({
          field_key: 'field_brand_new',
          field_label: 'field_brand_new',
          field_type: 'number',
        }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.name).toBe('Template Cập Nhật');
    });

    it('upload fileBuffer mới, cập nhật field có sẵn và giữ nguyên vector khi không đổi name/description', async () => {
      const mockInstance = {
        ...templateTestData.templateRecord,
        update: jest.fn(),
      };
      mockTemplate.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce({ id: 1, name: mockInstance.name });

      mockTemplate.findOne.mockResolvedValue(null);
      mockCloudServices.uploadToCloudinary.mockResolvedValue({ secure_url: 'https://cloud.com/buffer-new.docx' });
      
      const mockFieldUpdate = jest.fn();
      mockTemplateField.findOne.mockResolvedValue({
        id: 30,
        field_label: 'Nhãn Cũ',
        field_type: 'text',
        update: mockFieldUpdate,
      });

      const res = await updateTemplate(1, {
        fileBuffer: Buffer.from('new-binary'),
        fileName: 'new-binary.docx',
        fields: [{ field_key: 'field_exist', field_label: 'Nhãn Mới', field_type: 'date', is_required: true }],
      });

      expect(mockEmbedding.generateLocalVector).not.toHaveBeenCalled();
      expect(mockCloudServices.uploadToCloudinary).toHaveBeenCalled();
      expect(mockFieldUpdate).toHaveBeenCalledWith(
        { field_label: 'Nhãn Mới', field_type: 'date' },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.name).toBe(mockInstance.name);
    });

    it('cập nhật template thành công khi danh sách fields rỗng', async () => {
      const mockInstance = {
        ...templateTestData.templateRecord,
        update: jest.fn(),
      };
      mockTemplate.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce({ id: 1, name: 'Template Không Field' });

      mockTemplate.findOne.mockResolvedValue(null);
      mockEmbedding.generateLocalVector.mockResolvedValue([0.3]);

      const res = await updateTemplate(1, {
        name: 'Template Không Field',
        fields: [],
      });

      expect(mockTemplateFieldMapping.destroy).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.name).toBe('Template Không Field');
    });

    it('rollback transaction khi updateTemplate xảy ra lỗi', async () => {
      const mockInstance = { id: 1, name: 'Tên', update: jest.fn() };
      mockTemplate.findByPk.mockResolvedValue(mockInstance);
      mockTemplate.findOne.mockResolvedValue(null);
      mockEmbedding.generateLocalVector.mockRejectedValue(new Error('Update Failed'));

      await expect(updateTemplate(1, { name: 'Mới' })).rejects.toThrow('Update Failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});