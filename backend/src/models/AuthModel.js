import { DataTypes } from 'sequelize';
import sequelize from '../config.js'; 

const UserRole = {
    USER: 'user',
    ADMIN: 'admin'
};

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true},
    password: { type: DataTypes.STRING(255), allowNull: false},
    phone: { type: DataTypes.STRING(20), allowNull: true },
    fullname: { type: DataTypes.STRING(100), allowNull: true },
    role: {
        type: DataTypes.ENUM(UserRole.USER, UserRole.ADMIN),
        allowNull: false,
        defaultValue: UserRole.USER
    },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true,
        validate: {
            isEmail: true
        }
    },
    signature: { type: DataTypes.JSON, allowNull: true },
    avatar: { type: DataTypes.STRING(255), allowNull: true },
    gender: { type: DataTypes.STRING(10), allowNull: true},
    address: { type: DataTypes.STRING(255), allowNull: true },
    }, {
        tableName: 'users',
        timestamps: true
    });


const AuthMethod = sequelize.define('AuthMethod', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    provider: {type: DataTypes.STRING(50), allowNull: false },
    providerId: { type: DataTypes.STRING(255), allowNull: false },
}, {
    tableName: 'auth_methods',
    timestamps: true
});

const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    refreshToken: { type: DataTypes.TEXT, allowNull: false }
}, {
    tableName: 'refresh_tokens',
    timestamps: true
});

User.hasMany(AuthMethod, { foreignKey: 'user_id', as: 'authMethods' });
AuthMethod.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });


export { User, AuthMethod, RefreshToken, UserRole };