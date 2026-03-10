const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const adminroute = require('./routes/admin');
const shoproute = require('./routes/shop');
const sequelize = require('./util/database');
const errorcontrollers = require('./controllers/error');

app.use(bodyParser.urlencoded({external: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/admin', adminroute);
app.use(shoproute);

app.use(errorcontrollers.error404);

sequelize.sync().then((result) => {
    app.listen(3000);
}).catch((err) => {
    console.log(err);
});

