import { DataTypes } from 'sequelize';
import sequelize from '../config.js'; 

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true},
    password: { type: DataTypes.STRING(255), allowNull: false},
    phone: { type: DataTypes.STRING(20), allowNull: false },
    fullname: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true,
        validate: {
            isEmail: true
        }
    },
  
    gender: { type: DataTypes.STRING(10), allowNull: false},
    address: { type: DataTypes.STRING(255), allowNull: false },
    birthday: { type: DataTypes.DATEONLY, allowNull: true }
    }, {
        tableName: 'users',
        timestamps: true
    });


const AuthMethod = sequelize.define('AuthMethod', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    provider: {type: DataTypes.STRING(50), allowNull: false },
    providerId: { type: DataTypes.STRING(255), allowNull: false },
    refreshjwt: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false, defaultValue: () => new Date(Date.now() + 3600 * 1000) }
}, {
    tableName: 'auth_methods',
    timestamps: true
});

const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: {
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

User.hasMany(AuthMethod, { foreignKey: 'userId', as: 'authMethods' });
AuthMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });


export { User, AuthMethod, RefreshToken };