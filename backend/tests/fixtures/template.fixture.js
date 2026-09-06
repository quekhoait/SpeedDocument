export const templateTestData = {
  category: {
    id: 1,
    name: 'Hành chính',
    description: 'Mẫu văn bản hành chính',
  },
  templateRecord: {
    id: 1,
    name: 'Mẫu Đơn Xin Phép',
    description: 'Đơn xin nghỉ phép ngắn hạn',
    file_path: 'old_path.docx',
    template_vector: [0.1, 0.2, 0.3],
    template_category_id: 1,
    is_active: true,
  },
  createPayload: {
    name: 'Mẫu Hợp Đồng',
    description: 'Dùng cho kinh doanh',
    categoryId: 1,
    fileBuffer: Buffer.from('mock-word-binary'),
    fileName: 'contract.docx',
    fields: [
      { field_key: 'ten_kh', field_label: 'Tên KH', field_type: 'text' },
      { field_key: 'ten_kh', field_label: 'Tên KH Trùng', field_type: 'text', is_required: true }, // Giữ is_required: true ở phần tử ghi đè cuối
    ],
    documentId: 99,
    userId: 123,
  },
  updatePayload: {
    name: 'Tên mới',
    fields: [{ field_key: 'field_1', field_label: 'Label mới' }],
  },
  fieldRecord: {
    id: 10,
    field_key: 'key1',
    field_label: 'Label 1',
    field_type: 'text',
  },
};