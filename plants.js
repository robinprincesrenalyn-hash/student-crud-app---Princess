const express = require('express');
const Plant = require('../models/Plant');
const router = express.Router();

// Optional protection for write operations
function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key) return next();
  if (req.header('x-admin-key') === key) return next();
  res.status(401).json({ message: 'Invalid or missing admin key' });
}

// CREATE
router.post('/', requireAdmin, async (req, res) => {
  try {
    const plant = await Plant.create(req.body);
    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ (all) with search + filters
router.get('/', async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ commonName: rx }, { localName: rx }, { scientificName: rx }, { family: rx }];
    }
    if (category) filter.category = category;
    if (status) filter.conservationStatus = status;
    const plants = await Plant.find(filter).sort({ createdAt: -1 });
    res.json(plants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ (one)
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

// UPDATE
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json({ message: 'Plant deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

module.exports = router;
