import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


const authMiddleWare = (req, res, next) => {
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



export default authMiddleWare;