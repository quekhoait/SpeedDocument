import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tooltip,
  message,
  Upload,
  Spin,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { services } from '../services';

const ALL_CATEGORY = { id: 'ALL', name: 'Tất cả' };

export default function TemplatePage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [categories, setCategories] = useState([ALL_CATEGORY]);
  const [templates, setTemplates] = useState([]);

  const [extractedFields, setExtractedFields] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTemplates(filterCategory);
  }, [filterCategory]);

  const fetchCategories = async () => {
    try {
      const response = await services.getAllCategory();
      const rawCategories = response?.data?.data || [];
      setCategories([ALL_CATEGORY, ...rawCategories]);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục template:', error);
      message.error(error?.response?.data?.message || 'Không thể tải danh mục văn bản');
    }
  };

  const fetchTemplates = async (categoryId) => {
    try {
      setLoading(true);
      const catParam = categoryId === 'ALL' ? undefined : categoryId;
      const response = await services.getTemplates(catParam);
      const data = response?.data?.data || [];
      setTemplates(data);
    } catch (error) {
      console.error('Lỗi khi tải mẫu văn bản:', error);
      message.error('Không thể tải danh sách template');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (info) => {
    setFileList(info.fileList);
    const rawFile = info.file.originFileObj || info.file;

    if (info.file.status === 'removed' || !rawFile) {
      setExtractedFields([]);
      return;
    }

    setExtracting(true);
    try {
      const res = await services.previewTemplate(rawFile);
      const fields = res?.data?.data || [];
      setExtractedFields(fields);
      message.success('Trích xuất trường dữ liệu thành công!');
    } catch (err) {
      console.error('Lỗi trích xuất file:', err);
      message.error(err?.response?.data?.message || 'Không thể trích xuất trường dữ liệu');
    } finally {
      setExtracting(false);
    }
  };

  // --- HÀM XỬ LÝ CHỈNH SỬA TRỰC TIẾP TRÊN BẢNG FIELDS ---
  const handleFieldChange = (index, key, value) => {
    const updatedFields = [...extractedFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [key]: value,
    };
    setExtractedFields(updatedFields);
  };

  const handleDeleteField = (index) => {
    const updatedFields = extractedFields.filter((_, i) => i !== index);
    setExtractedFields(updatedFields);
  };

  const handleAddField = () => {
    setExtractedFields([
      ...extractedFields,
      { field_key: '', field_label: '', field_type: 'text' },
    ]);
  };

 const handleEditRecord = async (record) => {
  setEditingRecord(record);
  setModalVisible(true);
  setExtracting(true);

  try {
    const res = await services.getTemplate(record.id);
    const templateDetail = res?.data?.data;

    form.setFieldsValue({
      name: templateDetail.name,
      description: templateDetail.description,
      categoryId: templateDetail.template_category_id,
      is_active: templateDetail.is_active,
    });

    const formattedFields = (templateDetail.fieldMappings).map((item) => ({
      field_key: item.field?.field_key,
      field_label: item.field?.field_label,
      field_type: item.field?.field_type,
    }));

    setExtractedFields(formattedFields);

    setFileList(
      templateDetail.file_path
        ? [{ name: templateDetail.name}]
        : []
    );
  } catch (error) {
    console.error('Lỗi lấy chi tiết mẫu:', error);
    message.error('Không thể lấy chi tiết mẫu văn bản');
  } finally {
    setExtracting(false);
  }
};

  const handleAddNew = () => {
    setEditingRecord(null);
    form.resetFields();
    setExtractedFields([]);
    setFileList([]);
    setModalVisible(true);
  };

  const handleDeleteRecord = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa mẫu này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await services.deleteTemplate(id);
          message.success('Xóa thành công');
          fetchTemplates(filterCategory);
        } catch (error) {
          message.error(error?.response?.data?.message || 'Xóa thất bại');
        }
      },
    });
  };

  const handleSaveTemplate = async (values) => {
    setSubmitLoading(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        is_active: values.is_active,
        fields: extractedFields,
        file: fileList[0]?.originFileObj || fileList[0],
      };

      if (editingRecord) {
        await services.updateTemplate(editingRecord.id, payload);
        message.success('Cập nhật thành công');
      } else {
        await services.createTemplate(payload);
        message.success('Thêm mới thành công');
      }

      setModalVisible(false);
      fetchTemplates(filterCategory);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên Mẫu',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (text) => <span className="text-truncate">{text}</span>,
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 160,
      render: (_, record) => (
        <Tag color="blue">{record.category?.name || 'Chưa phân loại'}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (is_active) => {
        const color = is_active ? 'green' : 'red';
        const text = is_active ? 'Kích hoạt' : 'Đã khóa';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (data) => (
        console.log(data),
        <Space size="small">
          <Tooltip title="Xem file">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => data.previewUrl && window.open(data.previewUrl, '_blank')}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRecord(data)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRecord(data)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const fieldColumns = [
    {
      title: 'Mã trường (Tag)',
      dataIndex: 'field_key',
      key: 'field_key',
      width: '32%',
      render: (text, _, index) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(index, 'field_key', e.target.value)}
          size="small"
          placeholder="Mã trường"
          className="font-mono text-blue-600 !rounded"
        />
      ),
    },
    {
      title: 'Tên hiển thị (mô tả)',
      dataIndex: 'field_label',
      key: 'field_label',
      width: '38%',
      render: (text, _, index) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(index, 'field_label', e.target.value)}
          size="small"
          placeholder="Tên hiển thị"
          className="!rounded"
        />
      ),
    },
    {
      title: 'Kiểu dữ liệu',
      dataIndex: 'field_type',
      key: 'field_type',
      width: '22%',
      render: (text, _, index) => (
        <Select
          value={text || 'text'}
          onChange={(value) => handleFieldChange(index, 'field_type', value)}
          size="small"
          style={{ width: '100%' }}
          options={[
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Date', value: 'date' },
            { label: 'Boolean', value: 'boolean' },
          ]}
        />
      ),
    },
    
    {
      title: '',
      key: 'action',
      width: '8%',
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteField(index)}
        />
      ),
    },
  ];

  const filteredData = templates.filter((template) => {
    return (
      template.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <Card
      className="!rounded-xl !shadow-sm !border-gray-200 pb-6"
      title={<span className="text-lg font-semibold text-gray-900">Quản lý Mẫu Văn Bản</span>}
      bodyStyle={{ padding: '24px' }}
    >
      <Row gutter={[16, 16]} className="mb-4" align="middle">
        <Col xs={24} sm={12} lg={6}>
          <Input
            placeholder="Tìm kiếm mẫu..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="!rounded-lg !border-gray-300"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Lọc theo danh mục"
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: '100%' }}
            className="!rounded-lg"
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
        </Col>
        <Col xs={24} sm={12} lg={12} className="text-right">
          <Space>
            <Button icon={<DownloadOutlined />} className="hover:!border-blue-600 hover:!text-blue-600">
              Xuất file
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !border-0 hover:!shadow-lg"
            >
              Thêm template
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
        }}
        scroll={{ x: 1200 }}
        className="!text-sm"
      />

      <Modal
        title={editingRecord ? 'Chỉnh sửa Mẫu Văn Bản' : 'Thêm Mẫu Văn Bản Mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={1100}
        centered
        className="!rounded-xl"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTemplate} className="mt-4">
          <Row gutter={24} className="h-[460px]">
            <Col span={10} className="flex flex-col justify-between h-full">
              <div>
                <Form.Item
                  label={<span className="font-medium text-gray-700">Tên Mẫu</span>}
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên mẫu' }]}
                  className="mb-3"
                >
                  <Input placeholder="Nhập tên mẫu" className="!rounded-lg" />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={<span className="font-medium text-gray-700">Danh mục</span>}
                      name="categoryId"
                      rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                      className="mb-3"
                    >
                      <Select
                        placeholder="Chọn danh mục"
                        className="!rounded-lg"
                        options={categories
                          .filter((c) => c.id !== 'ALL')
                          .map((cat) => ({
                            label: cat.name,
                            value: cat.id,
                          }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<span className="font-medium text-gray-700">Trạng thái</span>}
                      name="is_active"
                      rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                      className="mb-3"
                    >
                      <Select
                        placeholder="Chọn trạng thái"
                        className="!rounded-lg"
                        options={[
                          { label: 'Kích hoạt', value: true },
                          { label: 'Đã khóa', value: false },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={<span className="font-medium text-gray-700">Mô tả</span>}
                  name="description"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                  className="mb-3"
                >
                  <Input.TextArea rows={2} placeholder="Nhập mô tả mẫu" className="!rounded-lg" />
                </Form.Item>
              </div>

              <Form.Item label={<span className="font-medium text-gray-700">Tải lên văn bản mẫu (.docx, .pdf)</span>} className="mb-0">
                <Upload.Dragger
                  beforeUpload={() => false}
                  maxCount={1}
                  fileList={fileList}
                  onChange={handleFileUpload}
                  accept=".docx,.pdf,.doc"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined className="!text-blue-500" />
                  </p>
                  <p className="ant-upload-text">Kéo thả hoặc click để chọn file</p>
                  <p className="ant-upload-hint text-xs">Hỗ trợ định dạng .docx, .doc, .pdf</p>
                </Upload.Dragger>
              </Form.Item>
            </Col>

            {/* BÊN PHẢI: Bảng Chỉnh Sửa Trường Dữ Liệu */}
            <Col span={14} className="border-l border-gray-100 pl-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <FileTextOutlined className="text-blue-600" /> Các trường dữ liệu trích xuất
                </span>
                <Space>
                  <Tag color="blue">{extractedFields.length} trường</Tag>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddField}
                  >
                    Thêm dòng
                  </Button>
                </Space>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Bạn có thể chỉnh sửa trực tiếp giá trị các ô trong bảng bên dưới
              </p>

              <div className="flex-1 min-h-0">
                <Spin spinning={extracting} tip="Đang phân tích file..." wrapperClassName="h-full">
                  <Table
                    dataSource={extractedFields}
                    columns={fieldColumns}
                    rowKey={(_, index) => index}
                    pagination={false}
                    size="small"
                    scroll={{ y: 360 }}
                    style={{ width: '100%' }}
                    className="border rounded-lg"
                    locale={{ emptyText: 'Chưa có dữ liệu trường. Vui lòng upload file mẫu hoặc bấm Thêm dòng.' }}
                  />
                </Spin>
              </div>
            </Col>
          </Row>

          <Divider className="my-4" />

          <div className="text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitLoading}
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !border-0"
              >
                {editingRecord ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}