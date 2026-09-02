import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRole } from '../models/AuthModel.js';

dotenv.config();


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: "ERR",
      message: "Unauthorized"
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, data) => {
    if (err) {
      return res.status(401).json({
        status: "ERR",
        message: "Unauthorized"
      });
    }
    req.user = data
    next();
  })
}


const authAdminMiddleWare = (req, res, next)=> {
  console.log(req.user?.role)
  if(req.user?.role !== UserRole.ADMIN){
    return res.status(403).json({
      status: "ERR",
      message: "Truy cập của bạn bị từ chối"
    })
  }
  next();  
}


const authMiddleware = {
  verifyToken,
  authAdminMiddleWare,
};

export default authMiddleware;