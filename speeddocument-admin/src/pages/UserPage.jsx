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
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
} from '@ant-design/icons';

/**
 * User Management Page
 * Quản lý người dùng với các tính năng:
 * - Danh sách người dùng
 * - Tìm kiếm, lọc, sắp xếp
 * - Thêm, sửa, xóa người dùng
 */
export default function UserPage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      role: 'admin',
      phone: '0901234567',
      joinDate: '2023-12-01',
      status: 'active',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@example.com',
      role: 'user',
      phone: '0902345678',
      joinDate: '2024-01-05',
      status: 'active',
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@example.com',
      role: 'moderator',
      phone: '0903456789',
      joinDate: '2024-01-10',
      status: 'active',
    },
    {
      id: 4,
      name: 'Phạm Thị D',
      email: 'phamthid@example.com',
      role: 'user',
      phone: '0904567890',
      joinDate: '2024-01-15',
      status: 'inactive',
    },
  ]);

  // Columns for table
  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const colors = {
          admin: 'red',
          moderator: 'blue',
          user: 'default',
        };
        const labels = {
          admin: 'Quản trị',
          moderator: 'Điều hành',
          user: 'Người dùng',
        };
        return <Tag color={colors[role]}>{labels[role]}</Tag>;
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 140,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const color = status === 'active' ? 'green' : 'red';
        const text = status === 'active' ? 'Hoạt động' : 'Không hoạt động';
        return <Tag color={color}>{text}</Tag>;
      },
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

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
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
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk() {
        setUsers(users.filter((user) => user.id !== id));
        message.success('Xóa thành công');
      },
    });
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingRecord) {
        setUsers(
          users.map((user) =>
            user.id === editingRecord.id ? { ...user, ...values } : user
          )
        );
        message.success('Cập nhật thành công');
      } else {
        const newUser = {
          id: Math.max(...users.map((u) => u.id), 0) + 1,
          ...values,
          joinDate: new Date().toISOString().split('T')[0],
        };
        setUsers([newUser, ...users]);
        message.success('Thêm mới thành công');
      }

      setModalVisible(false);
      setEditingRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <Card
      className="!rounded-xl !shadow-sm !border-gray-200"
      title={<span className="text-lg font-semibold text-gray-900">Quản lý Người dùng</span>}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Toolbar */}
      <Row gutter={[16, 16]} className="mb-4" align="middle">
        <Col xs={24} sm={12} lg={6}>
          <Input
            placeholder="Tìm kiếm người dùng..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="!rounded-lg !border-gray-300"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Lọc theo vai trò"
            value={filterRole}
            onChange={setFilterRole}
            style={{ width: '100%' }}
            className="!rounded-lg"
            options={[
              { label: 'Tất cả', value: '' },
              { label: 'Quản trị', value: 'admin' },
              { label: 'Điều hành', value: 'moderator' },
              { label: 'Người dùng', value: 'user' },
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
        title={editingRecord ? 'Chỉnh sửa Người dùng' : 'Thêm Người dùng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        className="!rounded-xl"
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-6">
          <Form.Item
            label={<span className="font-medium text-gray-700">Tên</span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nhập tên người dùng" className="!rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email" className="!rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Số điện thoại</span>}
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" className="!rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-700">Vai trò</span>}
            name="role"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              className="!rounded-lg"
              options={[
                { label: 'Quản trị', value: 'admin' },
                { label: 'Điều hành', value: 'moderator' },
                { label: 'Người dùng', value: 'user' },
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
                { label: 'Hoạt động', value: 'active' },
                { label: 'Không hoạt động', value: 'inactive' },
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
