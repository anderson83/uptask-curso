const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Referencia al Modelo donde vamos a autenticas
const Usuarios = require('../models/Usuarios');

//local strategy - Login con credenciales propios(usuario y passport)

passport.use(
    new LocalStrategy(
        //por default passport espera un usuario y passport
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        async (email,password, done)=>{
            try {
                const usuario = await Usuarios.findOne({
                    where: {email: email, activo:1 }
                });
                // El usuario existe, password incorrecto
                if(!usuario.verificarPassword(password)){
                    return done(null, false, {
                        message: 'Password Incorrecto'
                    })
                }

                // EL e-mail y password correctos
                return done(null, usuario);
            } catch (error) {
                // Ese usuario no existe(erro, usuario, mensajepersonalizado)
                return done(null, false, {
                    message: 'Esa cuenta no existe'
                })
            }
        }
    )
)

// serializar el usuarios
passport.serializeUser((usuario, callback)=>{
    callback(null, usuario);
});

// deserializar el usuarios
passport.deserializeUser((usuario, callback)=>{
    callback(null, usuario);
});

module.exports = passport;