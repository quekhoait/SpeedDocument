import bcrypt from "bcrypt";
import NodeCache from "node-cache";
import nodemailer from "nodemailer";
import { User, RefreshToken, AuthMethod } from "../models/AuthModel.js";
import myCache from "../utils/cache.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

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
  const { username, password, email } = userData;
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
    role: 'user'
  });

  await AuthMethod.create({
    user_id: newUser.id,
    provider: 'local',
    providerId: cleanEmail
  })
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
    user_id: userId,
    refreshToken: token,
  });
};

const getRefreshToken = async (token) => {
  return await RefreshToken.findOne({ where: { refreshToken: token } });
};

const logoutUser = async (userId) => {
  return await RefreshToken.destroy({ where: { userId } });
};

const saveSignature = async (userId, signature) => {
  try {
    if (!signature) {
      throw new Error("Không tìm thấy dữ liệu chữ ký (Base64)!");
    }
    const uploadResponse = await cloudinary.uploader.upload(signature, {
      folder: "signatures",
      resource_type: "image",
      format: "png", 
    });

    const signatureJson = {
      type: "image",
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      updatedAt: new Date().toISOString(),
    };

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }

    user.signature = signatureJson;
    await user.save(); 

    return {
      status: "OK",
      message: "Lưu chữ ký thành công!",
      signature: signatureJson,
    };
  } catch (error) {
    console.error("Lỗi Save Signature Service:", error);
    throw new Error(`Lưu chữ ký thất bại: ${error.message}`);
  }
};

const updateUser = async (userId, userData) => {
    const {
        phone,
        gender,
        fullname,
        address,
        avatar 
    } = userData;

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const updateData = {
        phone,
        gender,
        fullname,
        address,
    };
    if (avatar) {
        updateData.avatar = avatar; 
    }

    await user.update(updateData);

    return user;
};

const getAllUser = async(userId)=> {
 const currentUser = await User.findByPk(userId);
  if (!currentUser || currentUser.role !== 'admin') {
    return { status: 'ERROR', message: 'Bạn không có quyền truy cập!' };
  }
  const allUsers = await User.findAll({
    attributes: { exclude: ['password'] } 
  });
  return { status: 'OK', data: allUsers };
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
  saveSignature,
   updateUser,
   getAllUser
};
