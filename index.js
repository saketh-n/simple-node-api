const express = require("express");
const Joi = require("joi");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(express.json());

// Create an in-memory data store and allow us to add items via api
let items = [];

// Validation schema
const itemSchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().min(1).required(),
});

app.get("/items", (req, res) => {
  res.json(items);
});

// Add new item with validation
app.post("/items", (req, res) => {
  const { error, value } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const newItem = req.body;
  items.push(newItem);
  res.status(201).json(newItem);
});

// API to retrieve Items, by an id
app.get("/items/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = items.find((i) => i.id === id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).send("Item not found");
  }
});

// Update an item by ID
app.put("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { error, value } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const itemIndex = items.findIndex((i) => i.id === id);
  if (itemIndex !== -1) {
    items[itemIndex] = value;
    res.json(value);
  } else {
    res.status(404).send("Item not found");
  }
});

// Delete an item by ID
app.delete("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex((i) => i.id === id);
  items = items.filter((i) => i.id !== id);
  if (itemIndex === -1) {
    res.status(404).send(`Item ID: ${id} not found`);
  } else {
    res.status(204).send();
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
