const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({

    name: {

        type: String,
        required : true,
        trim: true  // Trim leading and trailing spaces
    },
    email: {
        type : String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {

            if(!validator.isEmail(value)){
                throw new Error('Email Address is not valid')
            }

        }

    },
    age:{

        type: Number,
        required: true,
        dafault: 0,
        validate(value){
            if(value < 0)
                throw new Error('Age must be positive')
        }
    },
    password: {

        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value){
            
            if( value.toLowerCase().includes('password') ){

                throw new Error('Password cannot contain the String Password')
            }
        }
    },
    avatar: {

        type: Buffer

    },
    tokens : [{

        token :{

            type:String,
            required:true
        }
    }]
}, {

    timestamps:true
})

userSchema.virtual('tasks', {

    ref: 'task',
    localField: '_id',
    foreignField: 'owner'
})
userSchema.methods.toJSON = function(){

    const user = this

    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens

    return userObject
}

// method invoke by the instances, also call instance method
userSchema.methods.generateAuthToken = async function(){

    const user = this
// It will return Json web token of the format 64bit header.64bit payload or body (id, timestamp, opt).64bit signature
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

//statics invoke directly by models without by instantiate mongoose, also called model methods
userSchema.statics.findByCredentials = async (email, password) => {

    const user = await User.findOne({email})

    if(!user)
        throw new Error('Unble to Login')

    const isMatch =  bcrypt.compare(password, user.password)

    if(!isMatch)
        throw new Error('Unable to Login') 

    return user
}

//Hashing the password before saving to database
userSchema.pre('save', async function(next) {

    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})
// remove all task before user removed
userSchema.pre('remove', async function (next) {

    const user = this

    await Task.deleteMany({ owner: user._id})

    next()
})
const User = new mongoose.model('Users', userSchema)

module.exports = User