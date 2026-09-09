import express from 'express';

const router = express.Router();

export const DEMO_USERS = {
  'command@routeiq.internal': {
    id: 'CR-01',
    name: 'Commander M. Ramanathan',
    role: 'CONTROL_ROOM',
    password: 'Command2026!'
  },
  'driver.rajesh@routeiq.internal': {
    id: 'DRV-104',
    name: 'Rajesh Kumar',
    role: 'DRIVER',
    password: 'Driver2026!'
  },
  'officer.selvam@routeiq.internal': {
    id: 'FO-02',
    name: 'Sub-Inspector M. Selvam',
    role: 'FIELD_OFFICER',
    password: 'Officer2026!'
  }
};

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = DEMO_USERS[email];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid official credentials or identifier.'
    });
  }
  res.json({
    success: true,
    token: `auth-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: email,
      role: user.role
    },
    role: user.role,
    requires2FA: true
  });
});

router.post('/verify-role', (req, res) => {
  const { role, verificationCode } = req.body || {};
  res.json({
    success: true,
    message: `Security clearance confirmed for role ${role || 'TACTICAL'}.`,
    verified: true,
    role: role
  });
});

export default router;
