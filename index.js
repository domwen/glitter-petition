const express = require('express');
const app = express();
const ca = require('chalk-animation');
const fs = require('fs');
const {
    saveSignature,
    getSignature,
    saveUser,
    getPassword,
    saveProfile,
    getSignerData
} = require('./db');
const bodyParser = require('body-parser');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { hashPass, checkPass } = require('./hash');

app.use(
    require('body-parser').urlencoded({
        extended: false
    })
);

app.use(
    cookieSession({
        secret: `Döner Kebap`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(express.static('./public'));
app.use(
    require('body-parser').urlencoded({
        extended: false
    })
);

function checkForSigId(req, res, next) {
    console.log('inside checkForSigId', req.session);

    if (!req.session.user) {
        res.redirect('/petition');
    } else {
        next();
    }
}

function checkForUserId(req, res, next) {
    console.log('inside checkForUserId', req.session);

    if (!req.session.user) {
        res.redirect('/register');
    } else {
        next();
    }
}

// REGISTER PAGE

app.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect('/petition');
    } else {
        res.render('register', {
            layout: 'main'
        });
    }
});

app.post('/register', (req, res) => {
    // console.log('insider POST register');
    // console.log(req.body.password);
    hashPass(req.body.password)
        .then(hashedSaltedPw => {
            // console.log('hashedSaltedPw', hashedSaltedPw);
            const params = [
                req.body.first || null,
                req.body.last || null,
                req.body.email || null,
                hashedSaltedPw || null
            ];
            saveUser(params).then(savedUserData => {
                // console.log('savedUserData :', savedUserData);
                req.session.user = {
                    firstName: savedUserData.rows[0].first,
                    lastName: savedUserData.rows[0].last,
                    userId: savedUserData.rows[0].id
                };
                console.log('req.session :', req.session);
                res.redirect('/profile');
            });
        })
        .catch(err => {
            console.log('There was an error: ', err);
            res.render('error', {
                layout: 'main',
                error: true
            });
        });
});

// PROFILE PAGE

app.get('/profile', checkForUserId, (req, res) => {
    res.render('profile', {
        layout: 'main',
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName
    });
});

app.post('/profile', (req, res) => {
    const params = [
        req.body.age || null,
        req.body.city || null,
        req.body.url || null,
        req.session.user.userId || null
    ];

    saveProfile(params)
        .then(results => {
            console.log('saveProfile results: ', results);
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('There was an error: ', err);
            res.render('error', {
                layout: 'main',
                error: true
            });
        });
});

// LOGIN PAGE

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main'
    });
});

app.post('/login', (req, res) => {
    // console.log('inside POST login');
    getPassword(req.body.email)
        .then(password => {
            var storedPw = password.rows[0].password;
            checkPass(req.body.password, storedPw).then(result => {
                if (result) {
                    console.log('Password match');
                    res.redirect('/petition');
                } else {
                    throw 'error';
                    console.log('Password unmatch');
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.render('login', {
                layout: 'main',
                error: true
            });
        });
});

// PETITION PAGE

app.get('/petition', checkForUserId, (req, res) => {
    res.render('petition', {
        layout: 'main',
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName
    });
});

app.post('/petition', (req, res) => {
    const params = [req.body.sig || null, req.session.user.userId || null];

    saveSignature(params)
        .then(results => {
            console.log('Results: ', results);
            req.session.user.signID = results.rows[0].id;
            console.log('req.session.SIGNid', req.session.user.signID);
            res.redirect('/thankyou');
        })
        .catch(err => {
            console.log('There was an error: ', err);
            res.render('error', {
                layout: 'main',
                error: true,
                errMessage: err
            });
        });
});

// THANK YOU

app.get('/thankyou', checkForSigId, (req, res) => {
    getSignature(req.session.user.signID).then(results => {
        res.render('thankyou', {
            layout: 'main',
            signatureUrl: results
        });
        console.log('After results :', results);
    });
});

// SIGNERS PAGE

app.get('/signers', (req, res) => {
    getSignerData().then(signerData => {
        res.render('signers', {
            layout: 'main',
            signers: signerData.rows,
            count: signerData.rowCount,
            homepage: signerData.rows[0].url,
            age: signerData.rows[0].age,
            city: signerData.rows[0].city
        });
    });
});

app.listen(process.env.PORT || 8080, () => ca.rainbow('La la laa laaaaa'));

// Not done:
// 1. Error message when fields empty
// 2. Signers page
