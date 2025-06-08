const express = require('express');
const router = express.Router();
const DriverCar = require('../Models/driverCar');
const mongoose = require('mongoose');

const Income = require('../models/income');
const Expense = require('../models/expense');
const FixedCost = require('../models/fixedCost');
const Reminder = require('../models/reminder');


const auth = require('../middlewares/auth');

// GET /drivercars - Obtener todos los carros del usuario autenticado
router.get('/', auth, async (req, res) => {
  try {
    const cars = await DriverCar.find({ idUser: req.user.id });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los vehículos', error: error.message });
  }
});

// POST /drivercars - Crear nuevo vehículo
router.post('/', auth, async (req, res) => {
  try {
    const { marca, placa } = req.body;

    if (!marca || !placa) {
      return res.status(400).json({ message: 'Marca y placa son obligatorias' });
    }

    const nuevoCarro = new DriverCar({
      idUser: req.user.id,
      marca,
      placa
    });

    const guardado = await nuevoCarro.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear vehículo', error: error.message });
  }
});

// PUT /drivercars/:id - Actualizar un vehículo por ID
router.put('/:id', auth, async (req, res) => {
  try {
    const { marca, placa } = req.body;

    const actualizado = await DriverCar.findOneAndUpdate(
      { _id: req.params.id, idUser: req.user.id },
      { marca, placa },
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ message: 'Vehículo no encontrado o no autorizado' });
    }

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar vehículo', error: error.message });
  }
});

// DELETE /drivercars/:id - Eliminar un vehículo
router.delete('/:id', auth, async (req, res) => {
  try {
    const eliminado = await DriverCar.findOneAndDelete({
      _id: req.params.id,
      idUser: req.user.id
    });

    if (!eliminado) {
      return res.status(404).json({ message: 'Vehículo no encontrado o no autorizado' });
    }

    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar vehículo', error: error.message });
  }
});



router.get('/:idCar', async (req, res) => {
  try {
    const carId = new mongoose.Types.ObjectId(req.params.idCar);

    const [incomes, expenses, fixedCosts, reminders] = await Promise.all([
      Income.find({ idCar: carId }),
      Expense.find({ idCar: carId }),
      FixedCost.find({ idCar: carId }),
      Reminder.find({ idCar: carId }),
    ]);

    const totalIngresos = Math.round(incomes.reduce((sum, i) => sum + Number(i.ingresoTotal || 0), 0));
    const totalKmIngresos = Math.round(incomes.reduce((sum, i) => sum + Number(i.klm || 0), 0));
    const totalGastos = Math.round(expenses.reduce((sum, e) => sum + Number(e.gastoTotal || 0), 0));
    const totalCostos = Math.round(fixedCosts.reduce((sum, c) => {
      const costoUnitario = c.klm > 0 ? Number(c.valor) / c.klm : 0;
      return sum + costoUnitario;
    }, 0));
    const costoOperativo = Math.round(totalCostos * totalKmIngresos);

    const fixedCostsWithRatio = fixedCosts.map(fc => ({
      ...fc.toObject(),
      costoPorKm: fc.klm > 0 ? Math.round(fc.valor / fc.klm) : 0
    }));

    res.json({
      resumenTotales: {
        totalIngresos,
        totalGastos,
        totalCostos,
        totalKmIngresos,
        costoOperativo,
      },
      ingresos: incomes,
      gastos: expenses,
      costos: fixedCostsWithRatio,
      recordatorios: reminders
    });

  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del vehículo', error: error.message });
  }
});

module.exports = router;
