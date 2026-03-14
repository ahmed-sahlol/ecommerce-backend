const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const adminroute = require('./routes/admin');
const shoproute = require('./routes/shop');
const sequelize = require('./util/database');
const Productmodel = require('./models/product');
const Usermodel = require('./models/user');
const errorcontrollers = require('./controllers/error');

app.use(bodyParser.urlencoded({external: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/admin', adminroute);
app.use(shoproute);

app.use(errorcontrollers.error404);

Productmodel.belongsTo(Usermodel, {constraints: true, onDelete: 'CASCADE'});
Usermodel.hasMany(Productmodel);

sequelize.sync({force: true}).then((result) => {
    app.listen(3000);
}).catch((err) => {
    console.log(err);
});

