const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

const indexRoutes = require('./routes/index');
const audioRoutes = require('./routes/audible');
const videoRoutes = require('./routes/visible');
app.use('/', indexRoutes);
app.use('/', audioRoutes);
app.use('/', videoRoutes);

/*
const routes = require('./api/router');
app.use('/', routes);
*/

// Error Handling Middleware
//const errorHandler = require('./middlewares/errorHandler');
//app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});

