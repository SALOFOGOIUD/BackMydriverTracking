const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminder');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const recordatorios = await Reminder.find({ idUser: req.user.id });
  res.json(recordatorios);
});

router.post('/', auth, async (req, res) => {
  const { idCar, dateStart, dateEnd, item, detalle } = req.body;
  const nuevo = new Reminder({ idUser: req.user.id, idCar, dateStart, dateEnd, item, detalle });
  res.status(201).json(await nuevo.save());
});

router.put('/:id', auth, async (req, res) => {
  const actualizado = await Reminder.findOneAndUpdate(
    { _id: req.params.id, idUser: req.user.id },
    req.body,
    { new: true }
  );
  res.json(actualizado);
});

router.delete('/:id', auth, async (req, res) => {
  await Reminder.findOneAndDelete({ _id: req.params.id, idUser: req.user.id });
  res.json({ message: 'Recordatorio eliminado' });
});

module.exports = router;