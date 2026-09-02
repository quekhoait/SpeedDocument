import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Space,
  Dropdown,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  FileOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DocumentPage from './DocumentPage';
import TemplatePage from './TemplatePage';
import { services } from '../services';

const { Header, Sider, Content } = Layout;

export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    message.success('Đã đăng xuất');
    navigate('/admin/login');
  };

  const getUser = async (token) => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      const res = await services.getUser(token);
      if (res.data?.status === "OK" || res.status === 200) {
        setCurrentUser(res.data?.user || res.data);
      }
    } catch (error) {
      if (error.response?.status === 401 && refreshToken) {
        try {
          const refreshRes = await services.refreshToken(refreshToken);
          if (refreshRes.data?.status === "OK" || refreshRes.status === 200) {
            const newAccessToken = refreshRes.data?.accessToken;
            localStorage.setItem('access_token', newAccessToken);
            await getUser(newAccessToken);
          } 
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
        }
      } else {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      getUser(token);
    } else {
      handleLogout();
    }
  }, []);




  const userMenuItems = [
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'templates',
      icon: <FileOutlined />,
      label: 'Quản lý Mẫu',
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const dashboardStats = [
    { label: 'Tổng Tài liệu', value: 1234, icon: <FileTextOutlined /> },
    { label: 'Mẫu', value: 89, icon: <FileOutlined /> },
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Hướng dẫn sử dụng',
      author: 'Admin',
      date: '2024-01-15',
      status: 'active',
      views: 1250,
    },
    {
      id: 2,
      name: 'Chính sách bảo mật',
      author: 'Admin',
      date: '2024-01-10',
      status: 'active',
      views: 890,
    },
    {
      id: 3,
      name: 'Điều khoản sử dụng',
      author: 'User',
      date: '2024-01-05',
      status: 'pending',
      views: 456,
    },
  ];

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
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
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-8">
              {dashboardStats.map((stat, index) => (
                <Col key={index} xs={24} sm={12} lg={6}>
                  <Card
                    hoverable
                    className="!rounded-xl !shadow-sm hover:!shadow-lg hover:!-translate-y-1 transition-all duration-300"
                    bordered={false}
                  >
                    <Statistic
                      title={<span className="text-sm font-medium text-gray-600">{stat.label}</span>}
                      value={stat.value}
                      prefix={<span className="text-2xl">{stat.icon}</span>}
                      valueStyle={{ color: '#667eea', fontSize: '28px', fontWeight: '700' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <Card
              title={<span className="text-lg font-semibold text-gray-900">Tài liệu gần đây</span>}
              className="!rounded-xl !shadow-sm !border-gray-200"
              bodyStyle={{ padding: '16px' }}
            >
              <Table
                columns={columns}
                dataSource={recentDocuments}
                pagination={false}
                size="small"
                rowKey="id"
                className="!text-sm"
              />
            </Card>
          </div>
        );

      case 'documents':
        return <DocumentPage />;

      case 'templates':
        return <TemplatePage />;

      case 'settings':
        return (
          <Card
            title={<span className="text-lg font-semibold text-gray-900">Cài đặt Hệ thống</span>}
            className="!rounded-xl !shadow-sm"
          >
            <p className="text-gray-600">Các cài đặt hệ thống sẽ hiển thị ở đây</p>
          </Card>
        );

      default:
        return <div>Dashboard</div>;
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="!fixed !left-0 !top-0 !bottom-0 !overflow-auto !h-screen"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="flex items-center justify-center gap-3 h-16 border-b border-white/10 px-4">
          <DashboardOutlined style={{ fontSize: '28px', color: '#fff' }} />
          {!collapsed && <h2 className="m-0 text-lg font-bold text-white whitespace-nowrap">SpeedDoc</h2>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
          onClick={(e) => setSelectedMenu(e.key)}
          className="!bg-transparent !border-none"
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }} className="transition-all duration-300">
        {/* Header */}
        <Header className="!bg-white !p-0 !shadow-sm !border-b !border-gray-200 !flex !justify-between !items-center">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="!text-lg !w-16 !h-16 hover:!bg-gray-100"
          />

          <Space size="large" className="mr-6">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" className="hover:!bg-gray-100">
                <Space size="small">
                  <Avatar icon={<UserOutlined />} className="!bg-blue-600" />
                  <span className="text-gray-700 font-medium">{currentUser?.fullname}</span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content className="p-6 overflow-auto min-h-full">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
