import AdminServices from '../services/AdminServices.js';

const countTemplate = async (req, res) => {
  try {
    const result = await AdminServices.countTemplate(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi controller countTemplate:', error);
    return res.status(500).json({ status: 'ERR', message: error.message });
  }
};

const countDocument = async (req, res) => {
  try {
    const result = await AdminServices.countDocument(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi controller countDocument:', error);
    return res.status(500).json({ status: 'ERR', message: error.message });
  }
};

const countUser = async (req, res) => {
  try {
    const result = await AdminServices.countUser(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi controller countUser:', error);
    return res.status(500).json({ status: 'ERR', message: error.message });
  }
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const result = await AdminServices.getDashboardAnalytics(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi controller getDashboardAnalytics:', error);
    return res.status(500).json({ status: 'ERR', message: error.message });
  }
};

export default {
  countTemplate,
  countDocument,
  countUser,
  getDashboardAnalytics,
};