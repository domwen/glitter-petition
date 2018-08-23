// Auth - Week 6, day 5

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
        last VARCHAR(200) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL
);

// logged in means setting a cookie (user id) from this table in the session cookie.
// Maybe also first and last name to display name everywhere.
// Alter signatures TABLE

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
    signature text NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL
);

// To check for signature right  after login, do another query



// week 6 day 5
// How to write middleware

// Purpose
app.use(req,res,next) =>{  //always these three arguments


}


function checkforId(req, res, next) {


}
// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser');
// const cookieSession = require('cookie-session');
// const hb = require('express-handlebars');
// app.engine('handlebars', hb());
// app.set('view engine', 'handlebars');
// app.use(express.static('./public'));
// app.use(
//     require('body-parser').urlencoded({
//         extended: false
//     })
// );
//
app.use(
    cookieSession({
        secret: `Döner Kebap`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
//
// app.get('/', (req, res) => {
//     res.render('scrap');
// });
//
// app.post('/', (req, res) => {
//     console.log(reg.body.check);
//     if (req.body.check) {
//         reg.session.checked = true;
//     }
// });
