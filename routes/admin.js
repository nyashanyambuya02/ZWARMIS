const express = require('express');
const router = express.Router();
const storage = require('../storage');

// Authentication middleware
function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({ success: false, error: 'Unauthorized (not authenticated)' });
  }

  const session = storage.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized (not authenticated)' });
  }

  const user = storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized (not authenticated)' });
  }

  req.user = user;
  next();
}

// Get all dams
router.get('/dams', (req, res) => {
  const dams = storage.getDams();
  res.json({
    success: true,
    count: dams.length,
    dams: dams
  });
});

// Get specific dam
router.get('/dams/:damId', (req, res) => {
  const { damId } = req.params;
  const dam = storage.getDamById(damId);

  if (!dam) {
    return res.status(404).json({ success: false, error: 'Dam not found' });
  }

  res.json({
    success: true,
    dam: dam
  });
});

// Helper function to calculate status based on capacity
function calculateStatus(capacity) {
  if (capacity > 80) return 'normal';
  if (capacity >= 60) return 'caution';
  return 'warning';
}

// Update dam
router.post('/update-dam', requireAuth, (req, res) => {
  const { damId, capacity_percent, notes } = req.body;

  if (!damId) {
    return res.status(400).json({ success: false, error: 'Missing damId' });
  }

  if (capacity_percent === undefined || capacity_percent === null || isNaN(capacity_percent) || capacity_percent < 0 || capacity_percent > 100) {
    return res.status(400).json({ success: false, error: 'Invalid capacity_percent' });
  }

  const dam = storage.getDamById(damId);
  if (!dam) {
    return res.status(404).json({ success: false, error: 'Dam not found' });
  }

  const status = calculateStatus(capacity_percent);

  const updates = {
    capacity_percent: parseFloat(capacity_percent),
    status: status,
    updated_by: req.user.username
  };

  if (notes) {
      updates.notes = notes;
  }

  const updatedDam = storage.updateDam(damId, updates);

  // Format response to match API_REFERENCE.md exactly
  res.json({
    success: true,
    message: `${updatedDam.name} updated successfully`,
    dam: updatedDam
  });
});

// Get all update history
router.get('/history', (req, res) => {
  const historyRaw = storage.getUpdateHistory();
  // Transform to match API_REFERENCE.md
  const history = historyRaw.map(h => ({
    timestamp: h.timestamp,
    damId: h.damId,
    capacity_percent: h.updates.capacity_percent,
    status: h.updates.status,
    updated_by: h.updates.updated_by,
    notes: h.updates.notes || ""
  }));

  res.json({
    success: true,
    count: history.length,
    history: history
  });
});

// Get dam-specific history
router.get('/history/:damId', (req, res) => {
  const { damId } = req.params;
  const historyRaw = storage.getUpdateHistory(damId);

  const history = historyRaw.map(h => ({
    timestamp: h.timestamp,
    capacity_percent: h.updates.capacity_percent,
    status: h.updates.status,
    updated_by: h.updates.updated_by,
    notes: h.updates.notes || ""
  }));

  res.json({
    success: true,
    damId: damId,
    count: history.length,
    history: history
  });
});

module.exports = router;
