const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const login = async ({ email, password }) => {
  if (!email) {
    throw new Error('Email is required');
  }

  const farmer = await prisma.farmer.findUnique({ where: { email } });

  if (!farmer) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, farmer.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const token = jwt.sign({ farmerId: farmer.id }, secret, { expiresIn: '7d' });
  return {
    token,
    farmer: {
      id: farmer.id,
      name: farmer.name,
      email: farmer.email
    }
  };
};

const changePassword = async (farmerId, { currentPassword, newPassword }) => {
  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) {
    throw new Error('Farmer profile not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, farmer.passwordHash);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.farmer.update({
    where: { id: farmerId },
    data: { passwordHash: newHash }
  });

  return { message: 'Password updated successfully' };
};

module.exports = { login, changePassword };

