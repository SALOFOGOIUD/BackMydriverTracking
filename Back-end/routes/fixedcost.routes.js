const express = require('express');
const router = express.Router();
const FixedCost = require('../Models/fixedCost');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
  const costos = await FixedCost.find({ idUser: req.user.id });
  res.json(costos);
});

router.post('/', auth, async (req, res) => {
  const { idCar, concepto, description, klm, valor } = req.body;

  // Validar valor (que sea número positivo)
  if (valor === undefined || valor === null || isNaN(valor) || valor < 0) {
    return res.status(400).json({ message: 'Valor debe ser un número positivo' });
  }

  const nuevo = new FixedCost({ idUser: req.user.id, idCar, concepto, description, klm: klm || 0, valor });
  res.status(201).json(await nuevo.save());
});

router.put('/:id', auth, async (req, res) => {
  const { valor, klm } = req.body;

  if (valor !== undefined && (isNaN(valor) || valor < 0)) {
    return res.status(400).json({ message: 'Valor debe ser un número positivo' });
  }

  if (klm !== undefined && (isNaN(klm) || klm < 0)) {
    return res.status(400).json({ message: 'Kilómetros debe ser un número positivo' });
  }

  const actualizado = await FixedCost.findOneAndUpdate(
    { _id: req.params.id, idUser: req.user.id },
    req.body,
    { new: true }
  );
  res.json(actualizado);
});

router.delete('/:id', auth, async (req, res) => {
  await FixedCost.findOneAndDelete({ _id: req.params.id, idUser: req.user.id });
  res.json({ message: 'Ítem de costo eliminado' });
});

router.get('/total', auth, async (req, res) => {
  try {
    const resultado = await FixedCost.aggregate([
      { $match: { idUser: req.user.id } },
      {
        $group: {
          _id: null,
          totalValor: { $sum: "$valor" },
          totalKlm: { $sum: "$klm" }
        }
      },
      {
        $project: {
          _id: 0,
          costoPorKm: {
            $cond: {
              if: { $eq: ["$totalKlm", 0] },
              then: 0,
              else: { $divide: ["$totalValor", "$totalKlm"] }
            }
          },
          totalValor: 1,
          totalKlm: 1
        }
      }
    ]);

    res.json(resultado[0] || { costoPorKm: 0, totalValor: 0, totalKlm: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular costo por kilómetro', error: error.message });
  }
});

module.exports = router;
