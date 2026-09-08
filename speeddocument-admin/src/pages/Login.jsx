import  { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, message, } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { services } from '../services';

export default function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleLogin = async (values) => {
  console.log(1)
  setLoading(true);
  try {
    const { email, password } = values;
    console.log(values)
    const res = await services.login(email, password);
    console.log(res)
    if(res.data.status==="OK"){
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem("refresh_token", res.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert("Thành công", res.data.message)
      navigate("/admin/dashboard");
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMsg =
      error.response?.data?.message || error.message || 'Đăng nhập thất bại';
    message.error(errorMsg);
  } finally {
    setLoading(false);
  }
};

 
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 overflow-hidden flex items-center justify-center">

      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/5 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/5 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>


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

            <div className="text-center mb-8">
              <div className="mb-4 text-6xl animate-bounce">📄</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpeedDocument Admin
              </h1>
              <p className="text-gray-500 text-sm mt-2">Quản lý tài liệu chuyên nghiệp</p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleLogin}
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
            </Form>

           
          </Card>

      
        </Col>
      </Row>
    </div>
  );
}
