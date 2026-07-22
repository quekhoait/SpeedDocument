import { User } from '../models/AuthModel.js';

const createUser = async (userData) => {
  const { username, password, email, phone, fullname, gender, address } = userData;
  const existingUser = await User.findOne({ where: { username } });
  
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const newUser = await User.create({
    username,
    password,
    email,
    phone,
    fullname,
    gender,
    address
  });

  return newUser;
};

export default { createUser };