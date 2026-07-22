import AuthServices from '../services/AuthServices.js';

const createUser = async (req, res) => {
  try {
    const { username, password, email, phone, fullname, gender, address } = req.body;
    if (!username || !password || !email || !phone || !fullname || !gender || !address ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newUser = await AuthServices.createUser({
      username,
      password,
      email,
      phone,
      fullname,
      gender,
      address
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const loginUser = async (req, res) => {
  res.status(501).json({ message: 'Login not implemented yet' });
};

export default { createUser, loginUser };