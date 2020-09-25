
const express = require('express');
const path =  require('path');
const routes = require('./routes')
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

//extraer valores de variables.env
require('dotenv').config({path: 'variables.env'})

//helpers con algunas funciones
const helpers = require('./helpers');

// Crear la conexion a la BD
const db = require('./config/db');

// Importar el modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');
db.sync()
    .then(() => console.log('Conectado al Servidor'))
    .catch(error => console.log(error));
// crear unaq app de express
const app = express();

//donde cargar los archivos estaticos
app.use(express.static('public'));

// habilitar pug
app.set('view engine', 'pug');

//habilitar bodyparser para leer los datos del formulario
app.use(bodyParser.urlencoded({extended: true}));


//añadir la carpeta de las vistas
app.set('views', path.join(__dirname, './views'));

//agregar flash messages
app.use(flash());

app.use(cookieParser());

//sessiones nor permiten navegar entre distintas paginas sin volvernos a autenticar
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

// pasar vardump a la aplicacion
app.use((req, res, next)=>{
    res.locals.vardump = helpers.vardump;
    res.locals.errores = req.flash();
    res.locals.usuario = {...req.user} || '';
    next();
});


app.use('/', routes())

// Servidor y Puerto

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port,host,()=>{
    console.log('El servidor esta funcionando');
});

