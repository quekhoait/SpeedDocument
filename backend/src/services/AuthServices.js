import bcrypt from "bcrypt";
import NodeCache from "node-cache";
import nodemailer from "nodemailer";
import { User, RefreshToken } from "../models/AuthModel.js";
import myCache from "../utils/cache.js";

const sendOTPEmail = async (email) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return { status: "ERR", message: "Email đã được đăng ký" };
  }
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  myCache.set(`otp_${email}`, otpCode);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_HOST_USER,
    to: email,
    subject: "Mã xác thực OTP của bạn",
    text: `Mã OTP của bạn là: ${otpCode}`,
  };
  await transporter.sendMail(mailOptions);
};

const verifyOTP = (email, inputOtp) => {
  const cleanEmail = email.toLowerCase().trim();
  const otpCached = myCache.get(`otp_${cleanEmail}`);
  if (!otpCached || inputOtp !== otpCached) {
    return { status: "ERR", message: "OTP sai hoặc đã hết hạn!" };
  }
  myCache.del(`otp_${cleanEmail}`);
  return { status: "OK" };
};

const createUser = async (userData) => {
  const { username, password, email, phone, fullname, gender, address } =
    userData;
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    return { status: "ERR", message: "Username đã tồn tại" };
  }
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  const newUser = await User.create({
    username,
    password: hashedPassword,
    email: cleanEmail,
    phone,
    fullname,
    gender,
    address,
  });

  return { status: "OK", user: newUser };
};

const loginUser = async (loginData) => {
  const { email, password } = loginData;
  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ where: { email: cleanEmail } });
  if (!user) {
    return {
      status: "ERR",
      message: "Email hoặc mật khẩu không đúng",
    };
  }
  let checkPassword = false;
  try {
    checkPassword = bcrypt.compareSync(password, user.password);
  } catch (e) {
    checkPassword = password === user.password;
  }
  if (!checkPassword) {
    return {
      status: "ERR",
      message: "Mật khẩu không đúng",
    };
  }
  return { status: "OK", message: "Đăng nhập thành công", user };
};

const getUserById = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { status: "ERR", message: "User not found" };
  }
  return { status: "OK", user };
};

const saveRefreshToken = async (userId, token) => {
  return await RefreshToken.create({
    userId: userId,
    refreshToken: token,
  });
};

const getRefreshToken = async (token) => {
  return await RefreshToken.findOne({ where: { refreshToken: token } });
};

const logoutUser = async (userId) => {
  return await RefreshToken.destroy({ where: { userId } });
};

export default {
  createUser,
  loginUser,
  getUserById,
  getRefreshToken,
  saveRefreshToken,
  logoutUser,
  sendOTPEmail,
  verifyOTP,
};
