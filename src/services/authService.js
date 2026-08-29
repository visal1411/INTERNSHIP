const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const login = async (email, password) => {
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
  return token;
};

module.exports = { login };
