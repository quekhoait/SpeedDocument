import { Op, fn, col, literal } from 'sequelize';

import { User } from '../models/AuthModel.js';
import Document from '../models/DocumentModel.js';
import { Template } from '../models/TemplateModel.js';

const buildDateFilter = (params = {}) => {
  const { filterType, startDate, endDate, date, month, year } = params;
  let start, end;

  const now = new Date();
  const vnFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayVN = vnFormatter.format(now); //yyyy-mm-dd

  if (filterType === 'today') {
    start = new Date(`${todayVN}T00:00:00.000+07:00`);
    end = new Date(`${todayVN}T23:59:59.999+07:00`);
  }else if (date) {
    start = new Date(`${date}T00:00:00.000+07:00`);
    end = new Date(`${date}T23:59:59.999+07:00`);
  }else if (month && year) {
    const m = String(month).padStart(2, '0');
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    start = new Date(`${year}-${m}-01T00:00:00.000+07:00`);
    end = new Date(`${year}-${m}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`);
  }else if (filterType === 'month') {
    const [currYear, currMonth] = todayVN.split('-');
    const lastDay = new Date(Number(currYear), Number(currMonth), 0).getDate();
    start = new Date(`${currYear}-${currMonth}-01T00:00:00.000+07:00`);
    end = new Date(`${currYear}-${currMonth}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`);
  }else if (filterType === 'year' || (year && !month)) {
    const targetYear = year || todayVN.split('-')[0];
    start = new Date(`${targetYear}-01-01T00:00:00.000+07:00`);
    end = new Date(`${targetYear}-12-31T23:59:59.999+07:00`);
  }else if (filterType === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  }
  return start && end ? { start, end } : null;
};

const getWhereClause = (model, dateRange) => {
  if (!dateRange) return {};
  const dateField = model.rawAttributes?.created_at ? 'created_at' : 'createdAt';
  return {
    [dateField]: { [Op.between]: [dateRange.start, dateRange.end] },
  };
};

const countTemplate = async (params = {}) => {
  try {
    const dateRange = buildDateFilter(params);
    const where = getWhereClause(Template, dateRange);
    const total = await Template.count({ where });
    return { status: 'OK', data: total };
  } catch (error) {
    console.error('Lỗi countTemplate:', error);
    throw error;
  }
};

const countDocument = async (params = {}) => {
  try {
    const dateRange = buildDateFilter(params);
    const where = getWhereClause(Document, dateRange);
    const total = await Document.count({ where });
    return { status: 'OK', data: total };
  } catch (error) {
    console.error('Lỗi countDocument:', error);
    throw error;
  }
};

const countUser = async (params = {}) => {
  try {
    const dateRange = buildDateFilter(params);
    const where = getWhereClause(User, dateRange);
    const total = await User.count({ where });
    return { status: 'OK', data: total };
  } catch (error) {
    console.error('Lỗi countUser:', error);
    throw error;
  }
};

const getDashboardAnalytics = async (params = {}) => {
  try {
    const dateRange = buildDateFilter(params);
    const baseWhere = getWhereClause(Document, dateRange);
    const topTemplates = await Document.findAll({
      where: {
        ...baseWhere,
        template_id: { [Op.ne]: null },
      },
      attributes: [
        'template_id',
        [fn('COUNT', col('Document.id')), 'total_count'],
      ],
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['name'],
          required: true,
        },
      ],
      group: ['Document.template_id', 'template.id', 'template.name'],
      order: [[literal('total_count'), 'DESC']],
      limit: 5,
    });

    const formattedTopTemplates = topTemplates.map((item) => ({
      template_id: item.template_id,
      name: item.template?.name || 'Không tên',
      count: parseInt(item.get('total_count'), 10) || 0,
    }));

    const topOne = formattedTopTemplates[0] || { name: 'Chưa có dữ liệu', count: 0 };

    return {
      status: 'OK',
      data: {
        topTemplates: formattedTopTemplates,
        topTemplate: topOne,
      },
    };
  } catch (error) {
    console.error('Lỗi tại AdminServices.getDashboardAnalytics:', error);
    throw error;
  }
};

export default {
  countTemplate,
  countDocument,
  countUser,
  getDashboardAnalytics,
};