const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const login = async ({ phone, password }) => {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  const farmer = await prisma.farmer.findUnique({ where: { phone } });

  if (!farmer) {
    throw new Error('Invalid phone number or password');
  }

  const isMatch = await bcrypt.compare(password, farmer.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid phone number or password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const token = jwt.sign({ farmerId: farmer.id }, secret, { expiresIn: '7d' });
  return {
    token,
    farmer: {
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone
    }
  };
};

module.exports = { login };
