import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import AuthServices from "../services/AuthServices.js";
import JwtServices from "../services/jwtServices.js";
import CloudServices from "../services/CloudServices.js";

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
        .json({ status: "ERR", message: "Missing required fields" });
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
      isAdmin: userLogin.user.isAdmin || false,
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
        isAdmin: decoded.isAdmin || false,
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
    const logout = await AuthServices.logoutUser(refreshToken);
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
    console.log(userId, signatureData)
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

export default {
  createUser,
  loginUser,
  getUser,
  refreshToken,
  logoutUser,
  sendOTP,
  saveSignature,
  updateUser
};
