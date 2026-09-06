import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import AuthServices from "../services/AuthServices.js";
import JwtServices from "../services/jwtServices.js";
import CloudServices from "../services/CloudServices.js";
import axios from "axios";
import querystring from "querystring";

const getGoogleAuthUrl = async (req, res) => {
  try {
    const { returnUrl } = req.query;
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      state: returnUrl || "",
      scope: "openid email profile",
    };
    const authUrl = `${rootUrl}?${new URLSearchParams(options).toString()}`;
    return res.status(200).json({
      status: "OK",
      url: authUrl,
    });
  } catch (err) {
    console.error("Lỗi Controller Get Google Auth URL:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
};

const loginWithGoogle = async (req, res) => {
  const targetRedirectUrl = req.query.state || process.env.FRONTEND_URL || "http://localhost:3000/login-success";
  try {
    const { code } = req.query;

    if (!code) {
      const separator = targetRedirectUrl.includes("?") ? "&" : "?";
      return res.redirect(`${targetRedirectUrl}${separator}error=missing_code`);
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = tokenRes.data;

    const googleUserRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const googleUser = googleUserRes.data; // { id, email, name, picture }

    let userResult = await AuthServices.findOrCreateGoogleUser({
      googleId: googleUser.id,
      email: googleUser.email,
      username: googleUser.name,
      avatar: googleUser.picture,
    });

    const user = userResult.user || userResult;

    const userData = {
      id: user.id,
      role: user.role,
    };

    const accessToken = JwtServices.genneralAccessToken(userData);
    const refreshToken = JwtServices.genneralRefreshToken(userData);

    await AuthServices.saveRefreshToken(user.id, refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    const separator = targetRedirectUrl.includes("?") ? "&" : "?";
    return res.redirect(`${targetRedirectUrl}${separator}accessToken=${accessToken}`);

  } catch (err) {
    console.error("Lỗi Controller Login With Google:", err.response?.data || err.message);
    const separator = targetRedirectUrl.includes("?") ? "&" : "?";
    return res.redirect(`${targetRedirectUrl}${separator}error=google_auth_failed`);
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "ERR",
        message: "Email is required",
      });
    }
    await AuthServices.sendOTPEmail(email);
    return res.status(200).json({
      status: "OK",
      message: "Mã OTP đã được gửi thành công!",
    });
  } catch (err) {
    console.error("Lỗi Controller Send OTP:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      confirm_password,
      email,
      otp
    } = req.body;
    if (
      !username ||
      !password ||
      !confirm_password ||
      !email ||
      !otp
    ) {
      return res
        .status(400)
        .json({ status: "ERR", message: "Dữ liệu không hợp lệ" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        status: "ERR",
        message: "Mật khẩu và xác nhận mật khẩu không khớp",
      });
    }
    const otpValidation = AuthServices.verifyOTP(email, otp);
    if (otpValidation.status === "ERR") {
      return res.status(400).json(otpValidation);
    }
    const result = await AuthServices.createUser(req.body);

    if (result.status === "ERR") {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      status: "OK",
      message: "User registered successfully",
      user: result.user,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "ERR",
        message: "Vui lòng điền đủ thông tin",
      });
    }

    const userLogin = await AuthServices.loginUser(req.body);

    if (userLogin.status === "ERR") {
      return res.status(400).json(userLogin);
    }

    const userData = {
      id: userLogin.user.id,
      role: userLogin.user.role,
    };

    const accessToken = JwtServices.genneralAccessToken(userData);
    const refreshToken = JwtServices.genneralRefreshToken(userData);

    await AuthServices.saveRefreshToken(userLogin.user.id, refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.status(200).json({
      status: "OK",
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user: userLogin.user,
    });
  } catch (err) {
    console.error("Lỗi Controller Login:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
};


const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await AuthServices.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        status: "ERR",
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: "OK",
      message: "User found",
      user: user.user,
    });
  } catch (err) {
    console.error("Lỗi Controller Get User:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) res.sendStatus(401);
    const refreshTokenDb = await AuthServices.getRefreshToken(refreshToken);
    if (!refreshTokenDb) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ status: "ERR", message: "Token không hợp lệ hoặc hết hạn" });
      }

      const accessToken = JwtServices.genneralAccessToken({
        id: decoded.id,
        role: decoded.role
      });

      return res.status(200).json({
        status: "OK",
        accessToken,
      });
    });
  } catch (err) {
    console.error("Refresh token verification error:", err.message);
    return res.sendStatus(403);
  }
};

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(204);
    await AuthServices.logoutUser(refreshToken);
    res.clearCookie("refreshToken");
    return res.status(200).json({
      status: "OK",
      message: "Đăng xuất thành công",
    });
  } catch (err) {
    console.error("Lỗi Controller Logout:", err);
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
};

const saveSignature = async(req, res) => {
 try {
      const userId = req.user.id;
    const { signatureData } = req.body;
    if (!userId || !signatureData) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu dữ liệu userId hoặc signatureData!",
      });
    }

    const result = await AuthServices.saveSignature(userId, signatureData);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      status: "ERR",
      message: err.message,
    });
  }
}

const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    let avatarUrl = null;
    if (req.file) {
      const result = await CloudServices.uploadAvatarToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      avatarUrl = result.secure_url;
    }
    const updatedUser = await AuthServices.updateUser(userId, {
      ...userData,
      avatar: avatarUrl,
    });

    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi updateUser:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

const getAllUser = async(req, res)=> {
  try{
     const userId = req.user.id;
      const user = await AuthServices.getAllUser(userId);

    if (!user) {
      return res.status(404).json({
        status: "ERR",
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: "OK",
      message: "User found",
      user: user.user,
    });
  }catch (error) {
    console.error("Lỗi updateUser:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
}

export default {
  createUser,
  loginUser,
  getUser,
  refreshToken,
  logoutUser,
  sendOTP,
  saveSignature,
  updateUser,
  getAllUser,
  getGoogleAuthUrl,
  loginWithGoogle
};
