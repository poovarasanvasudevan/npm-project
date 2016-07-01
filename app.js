/**
 * Created by poovarasanv on 29/6/16.
 */

var express = require('express'),
    stylus = require('stylus'),
    nib = require('nib'),
    Sequelize = require('sequelize'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    config = require('./models/config'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    faker = require('Faker'),
    app = express(),
    server = require('http').createServer(app),
    io = require("socket.io")(server);

var sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.sqlite'
});
sequelize.sync()

var User = sequelize.define('user', {
    phoneNumber: {
        type: Sequelize.STRING
    },
    socketId: {
        type: Sequelize.STRING
    },
    userName: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    displayName: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.TEXT
    },
    city: {
        type: Sequelize.STRING
    },
    activeStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: Sequelize.TRUE
    },
    createdDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});


function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib())
}
app.set('views', __dirname + '/views')
app.set('superSecret', config.secret);
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(morgan('dev'));
app.use(express.cookieParser());
app.use(express.session({secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: compile
    }
))
app.use(express.static(__dirname + '/public'))
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User
        .findById(id)
        .then(function (user, err) {
            done(err, user);
        });
});
passport.use(new LocalStrategy(
    function (username, password, done) {
        User.findOne({
            where: {
                userName: username
            }
        }).then(function (user) {
            if (!user) {
                return done(null, false, {message: 'Incorrect username.'});
            } else if (user) {
                if (user.password != password) {
                    return done(null, false, {message: 'Incorrect password.'});
                } else {
                    return done(null, user);
                }
            }
        })
    }
));
function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {

        res.redirect('/home')
    } else {
        res.render('index', {
            title: "Hello express"
        })
    }
})
app.get('/home', isAuth, function (req, res) {
    console.log(req.user.image);
    var a = []

    User.findAll({
        where: {
            userName: {
                $ne: req.user.userName
            }
        }
    }).then(function (users) {
        res.render('home', {
            user: req.user,
            friends: users
        });
    })
})

app.get('/setup', function (req, res) {

    User.create({
        userName: "poosan9@gmail.com",
        password: "password",
        displayName: "Poovarasan Vasudevan",
        image: faker.Image.imageUrl(),
        city: faker.Address.city()
    }).then(function (user) {
        console.log("User Created");
    })

    for (i = 0; i < 20; i++) {
        User.create({
            userName: faker.Internet.email(),
            password: "password",
            displayName: faker.Name.firstName() + " " + faker.Name.lastName(),
            image: faker.Image.imageUrl(),
            city: faker.Address.city()
        }).then(function (user) {
            console.log("User " + user.userName + " Created")
        })
    }
});

app.post('/login', function (req, res, next) {

    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/login');
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/home');
        });
    })(req, res, next);

})

app.get('/api', function (req, res) {
    res.json({message: "Welcome Message"})
})

app.get('/user', isAuth, function (req, res) {
    res.json(req.user)
})
app.get('/api/users', function (req, res) {
    User.findAll().then(function (users) {
        res.json(users)
    })
})

io.on('connection', function (socket) {
    socket.emit("Welcome to Socket IO")
})

server.listen(3000)