import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const genneralAccessToken = (payload) => {
  const accessToken = jwt.sign(
    payload, 
    process.env.ACCESS_TOKEN || 'default_access_secret', 
    { expiresIn: '60m' }
  );
  return accessToken;
};

const genneralRefreshToken = (payload) => {
  const refreshToken = jwt.sign(
    payload, 
    process.env.REFRESH_TOKEN || 'default_refresh_secret', 
    { expiresIn: '7d' }
  );
  return refreshToken;
};

export default {
  genneralAccessToken,
  genneralRefreshToken,
};