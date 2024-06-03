const express = require("express");
const Joi = require("joi");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const rateLimit = require("express-rate-limit");

const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(express.json());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Create an in-memory data store and allow us to add items via api
let items = [];

// Validation schema
const itemSchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().min(1).required(),
});

// Get all items with pagination, sorting, and search
app.get("/items", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortField = req.query.sortField || "id";
  const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
  const searchTerm = req.query.search || "";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  let filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = filteredItems.sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1 * sortOrder;
    if (a[sortField] > b[sortField]) return 1 * sortOrder;
    return 0;
  });

  const paginatedItems = sortedItems.slice(startIndex, endIndex);
  res.json({
    totalItems: filteredItems.length,
    totalPages: Math.ceil(filteredItems.length / limit),
    currentPage: page,
    items: paginatedItems,
  });
});

// Add new item with validation
app.post("/items", (req, res) => {
  const { error, value } = itemSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const itemExists = items.some((item) => item.id === value.id);
  if (itemExists) {
    return res.status(409).send("Item with the given ID already exists.");
  }
  items.push(value);
  res.status(201).json(value);
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
    return res.status(404).send(`Item ID: ${id} not found`);
  }
  res.status(204).send();
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Serve Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
