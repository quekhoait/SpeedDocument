import { useEffect, useMemo, useState } from 'react';
import { Card, Col, DatePicker, Radio, Row, Space, Spin, Statistic } from 'antd';
import { FileOutlined, FileTextOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip as ChartTooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { services } from '../services';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, ChartTooltip, Legend);

const { RangePicker } = DatePicker;

export default function AdminDashboard() {
  const [filterType, setFilterType] = useState('month');
  const [customRange, setCustomRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState({
    totalTemplates: 0,
    totalDocuments: 0,
    totalUsers: 0,
    topTemplate: 'Chưa có',
    topTemplateCount: 0,
    topTemplatesList: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      console.log('Fetching dashboard data with filterType:', filterType, 'and customRange:', customRange);
      try {
        const params = {
          filterType,
          startDate: customRange?.[0]?.toISOString(),
          endDate: customRange?.[1]?.toISOString(),
        };
        console.log('Fetching dashboard data with params:', params);
        const [templates, documents, users, analytics] = await Promise.all([
            services.countTemplates(token, params),
            services.countDocuments(token, params),
            services.countUsers(token, params),
            services.dashboardAnalytics(token, params),
        ]);

        const analyticsData = analytics.data?.data;
        const topTemplate = analyticsData.topTemplate || { name: 'Chưa có', count: 0 };
        setStatsData({
          totalTemplates: templates.data?.data,
          totalDocuments: documents.data?.data,
          totalUsers: users.data?.data,
          topTemplate: topTemplate?.name,
          topTemplateCount: topTemplate?.count,
          topTemplatesList: analyticsData?.topTemplates,
        });
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu thống kê:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [filterType, customRange]);

  const barChartData = useMemo(() => ({
    labels: statsData.topTemplatesList.length ? statsData.topTemplatesList.map((item) => item.name) : ['Không có dữ liệu'],
    datasets: [{
      label: 'Số lần sử dụng',
      data: statsData.topTemplatesList.length ? statsData.topTemplatesList.map((item) => item.count) : [0],
      backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      borderRadius: 6,
    }],
  }), [statsData.topTemplatesList]);

  const doughnutData = useMemo(() => ({
    labels: ['Tài liệu', 'Người dùng', 'Mẫu'],
    datasets: [{
      data: [statsData.totalDocuments, statsData.totalUsers, statsData.totalTemplates],
      backgroundColor: ['#4f46e5', '#06b6d4', '#10b981'],
      hoverOffset: 4,
    }],
  }), [statsData.totalDocuments, statsData.totalUsers, statsData.totalTemplates]);

  return (
    <Spin spinning={loading}>
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800 m-0">Tổng quan & Phân tích</h2>
            <p className="text-gray-500 text-sm m-0">Thống kê dữ liệu hệ thống</p>
          </div>
          <Space wrap>
            <Radio.Group value={filterType} onChange={(event) => setFilterType(event.target.value)} buttonStyle="solid">
              <Radio.Button value="today">Hôm nay</Radio.Button>
              <Radio.Button value="month">Tháng này</Radio.Button>
              <Radio.Button value="year">Năm nay</Radio.Button>
              <Radio.Button value="custom">Tùy chọn</Radio.Button>
            </Radio.Group>
            {filterType === 'custom' && <RangePicker onChange={setCustomRange} />}
          </Space>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}><Card bordered={false} className="!rounded-xl !shadow-sm"><Statistic title="Tổng Tài Liệu Tạo Ra" value={statsData.totalDocuments} prefix={<FileTextOutlined className="text-indigo-600" />} /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card bordered={false} className="!rounded-xl !shadow-sm"><Statistic title="Tổng Số Mẫu" value={statsData.totalTemplates} prefix={<FileOutlined className="text-emerald-500" />} /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card bordered={false} className="!rounded-xl !shadow-sm"><Statistic title="Tổng Số Người Dùng" value={statsData.totalUsers} prefix={<TeamOutlined className="text-cyan-600" />} /></Card></Col>
          <Col xs={24} sm={12} lg={6}><Card bordered={false} className="!rounded-xl !shadow-sm"><Statistic title="Lượt Dùng Mẫu Top 1" value={statsData.topTemplateCount} prefix={<TrophyOutlined className="text-amber-500" />} /><div className="text-xs text-gray-500 truncate mt-1">{statsData.topTemplate}</div></Card></Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}><Card title="Top Mẫu Được Dùng Nhiều Nhất" bordered={false} className="!rounded-xl !shadow-sm"><div className="h-72"><Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div></Card></Col>
          <Col xs={24} lg={8}><Card title="Tỉ Lệ Dữ Liệu Hệ Thống" bordered={false} className="!rounded-xl !shadow-sm"><div className="h-72 flex items-center justify-center"><Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div></Card></Col>
        </Row>
      </div>
    </Spin>
  );
}
