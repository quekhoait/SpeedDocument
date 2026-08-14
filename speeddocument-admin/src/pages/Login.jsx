import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Row, Col, Space, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 overflow-hidden flex items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/5 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/5 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Container */}
      <Row className="relative z-10 w-full" align="middle" justify="center" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={20} md={12} lg={8}>
          <Card
            className="rounded-2xl border-0 shadow-2xl"
            bordered={false}
            style={{
              background: 'white',
              padding: '40px',
            }}
          >
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="mb-4 text-6xl animate-bounce">📄</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpeedDoc Admin
              </h1>
              <p className="text-gray-500 text-sm mt-2">Quản lý tài liệu chuyên nghiệp</p>
            </div>

            {/* Login Form */}
            <Form
              form={form}
              layout="vertical"
            //   onFinish={onFinish}
            //   onFinishFailed={onFinishFailed}
              autoComplete="off"
              className="w-full"
            >
              <Form.Item
                label={<span className="font-medium text-gray-700">Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Nhập email"
                  size="large"
                  className="!rounded-lg !border-gray-300 hover:!border-blue-500 focus:!border-blue-600 focus:!shadow-lg"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-gray-700">Mật khẩu</span>}
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu"
                  size="large"
                  className="!rounded-lg !border-gray-300 hover:!border-blue-500 focus:!border-blue-600 focus:!shadow-lg"
                />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked" initialValue={false}>
                <Checkbox className="text-gray-600">Nhớ mật khẩu</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  htmlType="submit"
                  className="!rounded-lg !font-semibold !h-10 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!shadow-xl"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              {/* Forgot Password Link */}
              <div className="text-right">
                <a href="#" className="text-blue-600 hover:text-purple-600 text-sm font-medium transition">
                  Quên mật khẩu?
                </a>
              </div>
            </Form>

            {/* Divider */}
            <Divider className="my-5">Hoặc tiếp tục với</Divider>

            {/* Social Login */}
            <Space size="middle" className="w-full justify-center">
              <Button
                icon={<GoogleOutlined />}
                size="large"
                className="!w-12 !h-12 !rounded-lg !border-gray-300 hover:!border-blue-600 hover:!text-blue-600 hover:!shadow-lg transition"
                title="Đăng nhập với Google"
              />
              <Button
                icon={<GithubOutlined />}
                size="large"
                className="!w-12 !h-12 !rounded-lg !border-gray-300 hover:!border-gray-800 hover:!text-gray-800 hover:!shadow-lg transition"
                title="Đăng nhập với GitHub"
              />
            </Space>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                Chưa có tài khoản?{' '}
                <a href="#" className="text-blue-600 hover:text-purple-600 font-semibold transition">
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </Card>

          {/* Footer Info */}
          <div className="text-center mt-8 text-xs text-white/80">
            <Space size="small" split="|">
              <a href="#" className="hover:text-white transition">
                Điều khoản sử dụng
              </a>
              <a href="#" className="hover:text-white transition">
                Chính sách bảo mật
              </a>
              <a href="#" className="hover:text-white transition">
                Liên hệ hỗ trợ
              </a>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
}
