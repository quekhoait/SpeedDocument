import bcrypt from 'bcrypt';
import sequelize from './src/config.js';
import { User, UserRole } from './src/models/AuthModel.js';

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    // 1. Kiểm tra và xóa nếu tài khoản admin hoặc email admin đã tồn tại
    const deletedCount = await User.destroy({
      where: {
        username: 'admin'
      }
    });

    if (deletedCount > 0) {
      console.log(`Đã xóa ${deletedCount} tài khoản admin cũ.`);
    }

    // 2. Hash mật khẩu mới
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);

    // 3. Tạo tài khoản admin mới
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@gmail.com',
      fullname: 'System Administrator',
      role: UserRole.ADMIN,
      phone: '0123456789',
      gender: 'male',
      address: 'Headquarters'
    });

    console.log('Tạo mới tài khoản Admin thành công:', admin.toJSON());
  } catch (error) {
    console.error('Lỗi khi seed tài khoản Admin:', error);
  } finally {
    await sequelize.close();
  }
};

seedAdmin();