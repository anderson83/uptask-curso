const passport = require('passport');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/email');

const Usuarios = require('../models/Usuarios');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos Campos son Obligatorios'
});

// Funcion para revisar si el usuario esta logueado o no

exports.usuarioAutenticado=(req, res, next)=>{

    //Si el usuario esta autenticado, adelante
    if(req.isAuthenticated()){
        return next();
    }

    // sino esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

// funcion para cerrar session
exports.cerrarSesion = (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/iniciar-sesion');
    })
}

// genera un token si el usuario es valido
exports.enviarToken = async(req, res)=>{
    // verificar qu el usuario exista
    const {email} = req.body;
    const usuario = await Usuarios.findOne({where:{email}});

    //Si no existe el usuario
    if(!usuario){
        req.flash('error', 'No existe esa cuenta');
        res.render('reestablecer', {
            nombrePagina: 'Reestablecer tu Contraseña',
            errores: req.flash()
        })
    }

    // usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    
    //expiracion
    usuario.expiracion = Date.now() + 3600000;

    // guardamos en al abse de datos
    await usuario.save();

    // url de reset
    const resetUrl = `http://${req.headers.host}/reestablecer/${usuario.token}`;

   // Enviar el correo con el Token
   await enviarEmail.enviar({
       usuario,
       subject: 'Password Reset',
       resetUrl,
       archivo: 'reestablecer-password'
   });
    
   //terminar
   req.flash('correcto', 'Se envio un mensaje a tu correo');
   res.redirect('/iniciar-sesion');
}

exports.validarToken = async (req, res)=>{
    const usuario = await Usuarios.findOne({where:{token:req.params.token}});

    //sino encuentra el usuario
    if(!usuario){
        req.flash('error', 'No Valido');
        res.redirect('/reestablecer');
    }

    // Formulario para generar el password
    res.render('resetPassword', {
        nombrePagina: 'Reestablecer Contraseña'
    })
}

//cambia el password por uno nuevo


exports.actualizarPassword = async (req, res)=>{
    console.log(req.params.token);
    //verifica el token y la fecha de verificacion
    const usuario = await Usuarios.findOne(
        {
        where:{
            token: req.params.token,
            expiracion: {
                [Op.gte]: Date.now()
            }
        }

    });

    // Verificamos que existe
    if(!usuario){
        req.flash('error', 'No Valido');
        res.redirect('/reestablecer');
    }

    //hashear el Password
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null,
    usuario.expiracion = null;

    //guardamos el nuevo Password
    await usuario.save();

    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');
}