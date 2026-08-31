const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate farmer and obtain JWT token
 *     description: |
 *       Authenticates a farmer account using phone number (or email) and password.
 *       On successful authentication, returns a signed JWT token valid for 7 days
 *       along with the farmer's profile information.
 *       The token must be provided in the `Authorization: Bearer <token>` header for all farmer-scoped endpoints.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successfully authenticated. Returns JWT token and farmer profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error (e.g. phone/email missing or empty password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Invalid credentials (incorrect phone number or password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.login);

module.exports = router;
