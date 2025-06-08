const express = require('express');
const router = express.Router();
const Income = require('../models/income');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const ingresos = await Income.find({ idUser: req.user.id });
  res.json(ingresos);
});

router.post('/', auth, async (req, res) => {
  const { idCar, dateStart, dateEnd, ingresoTotal, klm } = req.body;
  const nuevo = new Income({ idUser: req.user.id, idCar, dateStart, dateEnd, ingresoTotal, klm });
  res.status(201).json(await nuevo.save());
});

router.put('/:id', auth, async (req, res) => {
  const actualizado = await Income.findOneAndUpdate(
    { _id: req.params.id, idUser: req.user.id },
    req.body,
    { new: true }
  );
  res.json(actualizado);
});

router.delete('/:id', auth, async (req, res) => {
  await Income.findOneAndDelete({ _id: req.params.id, idUser: req.user.id });
  res.json({ message: 'Ingreso eliminado' });
});

router.get('/total', auth, async (req, res) => {
  try {
    const total = await Income.aggregate([
      { $match: { idUser: req.user.id } },
      { $group: { _id: null, totalIngreso: { $sum: "$ingresoTotal" } } }
    ]);
    res.json({ totalIngreso: total[0]?.totalIngreso || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular total de ingresos', error: error.message });
  }
});

module.exports = router;