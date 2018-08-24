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
    getSignerData,
    lookForCity,
    extractProfileInfo,
    updateUserTable,
    updateUserTableWithoutPassword,
    updateProfileTable
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
    res.render('register', {
        layout: 'main'
    });
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

// EDIT PROFILE PAGE

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// In GET part of profile edit we need to fill our forms with the information from the Tables, so we use cool query, which allows
/// us to combine two or more tables. And to display information we created new handlebars where we inser information.
/// In our html we simply insert this value to the "value" property and thats how it will be visible on page load.
///
/// In post request we need to update two tables. Contrary to how we have extracted information from tables, we will need to create two separate
/// quries for two tables. And even one more for the tbale with the password and we will have to check if user also changed the password.
///////////////////////////////////////////////////////////////////////////////////

app.get('/profile/edit', (req, res) => {
    var userId = req.session.user.userId;
    console.log(' user ID  ', userId);
    extractProfileInfo(userId)
        .then(result => {
            console.log('This is my results:', result);
            res.render('profileEdit', {
                layout: 'main',
                firstName: result.rows[0].first,
                lastName: result.rows[0].last,
                email: result.rows[0].email,
                // password: result.rows[0].password,
                age: result.rows[0].age,
                city: result.rows[0].city,
                url: result.rows[0].url
            });
        })
        .catch(err => {
            console.log('Error in extractProfileInfo:', err);
            res.render('profileEdit', {
                layout: 'main',
                error: true,
                errMessage: err
            });
        });
});

app.post('/profile/edit', (req, res) => {
    if (req.body.password != '') {
        hashPass(req.body.password).then(hashedPw => {
            updateUserTable(
                req.session.user.userId,
                req.body.first,
                req.body.last,
                req.body.email,
                hashedPw
            ).catch(err => {
                console.log('Error in POST profile/edit :', err);
                res.render('profileEdit', {
                    layout: 'main',
                    error: true,
                    errMessage: err
                });
            });
        });
    } else {
        updateUserTableWithoutPassword(
            req.session.user.userId,
            req.body.first,
            req.body.last,
            req.body.email
        ).catch(err => {
            console.log('Error in updateUserTableWithoutPassword:', err);
            res.render('profileEdit', {
                layout: 'main',
                error: true,
                errMessage: err
            });
        });
    }

    updateProfileTable(
        req.body.age,
        req.body.city,
        req.body.url,
        req.session.user.userId
    )
        .then(result => {
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error in updateProfileTable: ', err);
            res.render('profileEdit', {
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
            var userDataObject = password;
            var storedPw = password.rows[0].password;
            checkPass(req.body.password, storedPw).then(result => {
                if (result) {
                    console.log(
                        'inside POST login after checkpass :',
                        userDataObject
                    );
                    req.session = {
                        user: {
                            userId: userDataObject.rows[0].id,
                            firstName: userDataObject.rows[0].first,
                            lastName: userDataObject.rows[0].last,
                            signID: userDataObject.rows[0].id
                        }
                    };
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
                error: true,
                errMessage: err
            });
        });
});

// PETITION PAGE

app.get('/petition', checkForUserId, (req, res) => {
    console.log('req.session.user.firstName: ', req.session.user.firstName);
    console.log('req.session.user.lastName :', req.session.user.lastName);
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
            age: signerData.age,
            city: signerData.rows[0].city,
            url: signerData.url
        });
    });
});

// SIGNERS BY CITY

app.get('/signers/:city', (req, res) => {
    var cityName = req.params.city;
    lookForCity(cityName).then(names => {
        res.render('signersByCity', {
            layout: 'main',
            signers: names.rows,
            count: names.rowCount,
            age: names.age,
            city: names.city,
            url: names.url
        });
    });
});

// LOGOUT

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// When we go for /logout, which we access with our button, it will set out session to be null, so when we check if we are logged in,
/// it will fail and redirect us to the registration page.
///////////////////////////////////////////////////////////////////////////////////

app.get('/logout', function(req, res) {
    req.session = null;
    res.redirect('/login');
});

app.listen(process.env.PORT || 8080, () => ca.rainbow('La la laa laaaaa'));
