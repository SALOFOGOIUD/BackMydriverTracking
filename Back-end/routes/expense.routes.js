const express = require('express');
const router = express.Router();
const Expense = require('../Models/expense');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const gastos = await Expense.find({ idUser: req.user.id });
  res.json(gastos);
});

router.post('/', auth, async (req, res) => {
  const { idCar, dateStart, dateEnd, concepto, gastoTotal } = req.body;
  const nuevo = new Expense({ idUser: req.user.id, idCar, dateStart, dateEnd, concepto, gastoTotal });
  res.status(201).json(await nuevo.save());
});

router.put('/:id', auth, async (req, res) => {
  const actualizado = await Expense.findOneAndUpdate(
    { _id: req.params.id, idUser: req.user.id },
    req.body,
    { new: true }
  );
  res.json(actualizado);
});

router.delete('/:id', auth, async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, idUser: req.user.id });
  res.json({ message: 'Gasto eliminado' });
});

router.get('/total', auth, async (req, res) => {
  try {
    const total = await Expense.aggregate([
      { $match: { idUser: req.user.id } },
      { $group: { _id: null, totalGasto: { $sum: "$gastoTotal" } } }
    ]);
    res.json({ totalGasto: total[0]?.totalGasto || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular total de gastos', error: error.message });
  }
});

module.exports = router;
