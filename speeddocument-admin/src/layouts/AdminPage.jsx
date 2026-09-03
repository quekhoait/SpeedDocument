import { useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Dropdown,
    Layout,
    Menu,
    message,
    Space,
} from 'antd';
import {
    DashboardOutlined,
    FileOutlined,
    FileTextOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { services } from '../services';

const { Header, Sider, Content } = Layout;

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan', path: '/admin/dashboard' },
    { key: 'templates', icon: <FileOutlined />, label: 'Quản lý Mẫu', path: '/admin/templates' },
    { type: 'divider' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt', path: '/admin/settings' },
  ];

export default function AdminPage() {
  const [collapsed, setCollapsed] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      services.getUser(token).then((response) => {
          console.log('Thông tin người dùng:', response.data);
          if (response.data?.status === 'OK' ) {
            setCurrentUser(response.data?.user);
          }
        })
        .catch((error) => console.error('Lỗi lấy thông tin người dùng:', error));
    }, []);

    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      message.success('Đã đăng xuất');
      navigate('/admin/login');
    };

    const selectedKey = menuItems.find((item) => item.path === location.pathname)?.key || 'dashboard';

    return (
      <Layout className="min-h-screen bg-gray-50">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="!fixed !left-0 !top-0 !bottom-0 !overflow-auto !h-screen z-10"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' }}
        >
          <div className="flex items-center justify-center gap-3 h-16 border-b border-white/10 px-4">
            <DashboardOutlined style={{ fontSize: '24px', color: '#fff' }} />
            {!collapsed && <h2 className="m-0 text-lg font-bold text-white tracking-wide">SpeedDoc</h2>}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => {
              const item = menuItems.find((menuItem) => menuItem.key === key);
              if (item?.path) navigate(item.path);
            }}
            className="!bg-transparent !border-none mt-2"
          />
        </Sider>

        <Layout style={{ marginLeft: collapsed ? 80 : 200 }} className="transition-all duration-300">
          <Header className="!bg-white !px-6 !shadow-sm !border-b !border-gray-200 !flex !justify-between !items-center sticky top-0 z-10 h-16">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-lg hover:!bg-gray-100"
            />
            <Dropdown
              menu={{
                items: [
                  { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined />, onClick: () => navigate('/admin/settings') },
                  { type: 'divider' },
                  { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
                ],
              }}
              placement="bottomRight"
            >
              <Button type="text" className="hover:!bg-gray-100 !h-10">
                <Space size="small">
                  <Avatar icon={<UserOutlined />} className="!bg-indigo-600" />
                  <span className="text-gray-700 font-medium">{currentUser?.fullname}</span>
                </Space>
              </Button>
            </Dropdown>
          </Header>
          <Content className="p-6 overflow-auto">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    );
}
