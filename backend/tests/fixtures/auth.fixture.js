export const authTestData = {
  validUser: {
    id: 1,
    username: 'testuser',
    email: 'testuser@example.com',
    role: 'user',
  },
  adminUser: {
    id: 2,
    username: 'adminuser',
    email: 'admin@example.com',
    role: 'admin',
  },
  newUserPayload: {
    username: 'newuser',
    password: 'password123',
    email: 'newuser@example.com',
  },
  loginPayload: {
    email: 'testuser@example.com',
    password: 'password123',
  },
  googleUserPayload: {
    googleId: '123456',
    email: 'newgoogle@test.com',
    username: 'Google User',
    avatar: 'https://new-avatar.png',
  },
  validSignatureBase64:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};