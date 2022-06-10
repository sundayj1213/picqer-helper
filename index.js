const picqerRouter = require('./routes/picqer');
const basicAuth = require('express-basic-auth');
const express = require('express');
const morgan = require('morgan');
const app = express();

// handle auth
app.use(basicAuth({
  users: { sunday: '' }
}));
// enable logging
app.use(morgan('dev'));
// Tell express to use body-parser's JSON parsing
app.use(express.json())

// router piqer requests
app.use('/picqer', picqerRouter);

app.listen(process.env.PORT || 3000);
