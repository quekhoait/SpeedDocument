export const documentTestData = {
  templateRecord: {
    id: 1,
    title: 'Đơn Xin Nghỉ Phép',
    name: 'Đơn Xin Nghỉ Phép',
    file_path: 'https://cloud.com/template.docx',
    template_category_id: 1,
    get: (field) => (field === 'distance' ? 0.15 : null),
  },

  documentRecord: {
    id: 10,
    template_id: 1,
    user_id: 1,
    extracted_data: { ho_ten: 'Nguyễn Văn A', ly_do: 'Bệnh' },
    missing_fields: [],
    status: true,
    file_path: 'https://cloud.com/doc.docx',
    signature: {
      url: 'https://cloud.com/sig.png',
      public_id: 'sig_1',
    },
    update: null, // gán jest.fn() trong test
    save: null,
  },

  userRecord: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    signature: {
      type: 'image',
      url: 'https://cloud.com/user-sig.png',
    },
  },

  mockAnalysisSuccess: {
    isDocumentRequest: true,
    documentType: 'Đơn xin nghỉ phép',
    searchText: 'nghỉ ốm',
    confidence: 0.95,
  },

  mockAiComplete: {
    isComplete: true,
    data: { ho_ten: 'Nguyễn Văn A' },
    missingFields: [],
    followUpQuestion: null,
  },

  mockAiIncomplete: {
    isComplete: false,
    data: { ho_ten: 'Nguyễn Văn A' },
    missingFields: ['ly_do'],
    followUpQuestion: 'Lý do bạn xin nghỉ là gì?',
  },

  validSignatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};