import React, { useState } from 'react';
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
  Input as AntInput,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

/**
 * Document Management Page
 * Hiển thị danh sách tài liệu với các tính năng:
 * - Tìm kiếm, lọc, sắp xếp
 * - Thêm, sửa, xóa tài liệu
 */
export default function DocumentPage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Hướng dẫn sử dụng',
      description: 'Hướng dẫn chi tiết cách sử dụng hệ thống',
      author: 'Admin',
      createdAt: '2024-01-15',
      status: 'active',
      views: 1250,
      category: 'guide',
    },
    {
      id: 2,
      name: 'Chính sách bảo mật',
      description: 'Chính sách bảo vệ dữ liệu người dùng',
      author: 'Admin',
      createdAt: '2024-01-10',
      status: 'active',
      views: 890,
      category: 'policy',
    },
    {
      id: 3,
      name: 'Điều khoản sử dụng',
      description: 'Các điều khoản và điều kiện sử dụng dịch vụ',
      author: 'User',
      createdAt: '2024-01-05',
      status: 'pending',
      views: 456,
      category: 'terms',
    },
    {
      id: 4,
      name: 'FAQ Thường gặp',
      description: 'Các câu hỏi thường gặp và câu trả lời',
      author: 'Support',
      createdAt: '2024-01-01',
      status: 'active',
      views: 2100,
      category: 'faq',
    },
  ]);

  // Columns for table
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text) => <span className="text-truncate">{text}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const colors = {
          guide: 'blue',
          policy: 'green',
          terms: 'orange',
          faq: 'purple',
        };
        return <Tag color={colors[category] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const color = status === 'active' ? 'green' : 'orange';
        const text = status === 'active' ? 'Kích hoạt' : 'Chờ duyệt';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      sorter: (a, b) => a.views - b.views,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button type="primary" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRecord(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRecord(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Handlers
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      category: record.category,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleDeleteRecord = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bản ghi này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk() {
        setDocuments(documents.filter((doc) => doc.id !== id));
        message.success('Xóa thành công');
      },
    });
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingRecord) {
        setDocuments(
          documents.map((doc) =>
            doc.id === editingRecord.id ? { ...doc, ...values } : doc
          )
        );
        message.success('Cập nhật thành công');
      } else {
        const newDocument = {
          id: Math.max(...documents.map((d) => d.id), 0) + 1,
          ...values,
          author: 'Admin',
          createdAt: new Date().toISOString().split('T')[0],
          views: 0,
        };
        setDocuments([newDocument, ...documents]);
        message.success('Thêm mới thành công');
      }

      setModalVisible(false);
      setEditingRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredData = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchText.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !filterStatus || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card
      className="!rounded-xl !shadow-sm !border-gray-200"
      title={<span className="text-lg font-semibold text-gray-900">Quản lý Tài liệu</span>}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Toolbar */}
      <Row gutter={[16, 16]} className="mb-4" align="middle">
        <Col xs={24} sm={12} lg={6}>
          <AntInput
            placeholder="Tìm kiếm tài liệu..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="!rounded-lg !border-gray-300"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Lọc theo trạng thái"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: '100%' }}
            className="!rounded-lg"
            options={[
              { label: 'Tất cả', value: '' },
              { label: 'Kích hoạt', value: 'active' },
              { label: 'Chờ duyệt', value: 'pending' },
            ]}
            allowClear
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
              Thêm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Table */}
      <Table
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

      {/* Modal */}
      <Modal
        title={editingRecord ? 'Chỉnh sửa Tài liệu' : 'Thêm Tài liệu mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        className="!rounded-xl"
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-6">
          <Form.Item
            label={<span className="font-medium text-gray-700">Tiêu đề</span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề tài liệu" className="!rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Mô tả</span>}
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả tài liệu" className="!rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Danh mục</span>}
            name="category"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select
              placeholder="Chọn danh mục"
              className="!rounded-lg"
              options={[
                { label: 'Hướng dẫn', value: 'guide' },
                { label: 'Chính sách', value: 'policy' },
                { label: 'Điều khoản', value: 'terms' },
                { label: 'FAQ', value: 'faq' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Trạng thái</span>}
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select
              placeholder="Chọn trạng thái"
              className="!rounded-lg"
              options={[
                { label: 'Kích hoạt', value: 'active' },
                { label: 'Chờ duyệt', value: 'pending' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !border-0"
              >
                {editingRecord ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
