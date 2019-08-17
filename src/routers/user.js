const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()
 


router.post('/users', async (req, res) => {

    
    const user = new User(req.body)

    try{

        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})

    } catch (e){

        res.status(400).send(e)

    }
    

})
router.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()

    } catch (error) {
        
        res.status(500).send()
    }
})
router.post('/users/logoutAll', auth, async (req, res) => {

    try {

        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (error) {
        
        res.status(500).send()
    }
})
router.post('/users/login', async (req, res) => {

    try{

        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})

    } catch(e){

        res.status(400).send(e)
    }
})
router.get('/users/me', auth, async (req, res) => {

    res.send(req.user)

    // User.find({}).then( (users) => {

    //     res.status(202).send(users)
    // }).catch( (error) => {

    //     res.status(500).send(error)
    // })

} )

router.get('/users/:id', async (req, res) => {

    const _id = req.params.id

    try {

        const user = await User.findById(_id)
        if(!user)
            return res.status(404).send()

        res.status(202).send(user)

    } catch (e) {

        res.status(500).send()


    }
    // User.findById(_id).then( (user) => {

    //     if(!user)
    //         return res.status(404).send()

    //     res.status(200).send(user)
    // }).catch( (e) => {

    //     res.status(500).send()
    // })
})

router.patch('/users/me', auth, async (req , res) => {

    const updates = Object.keys(req.body)
    // console.log(req.body)
    const allowedUpdates = ['name', 'age', 'password', 'email']
    const validOperations = updates.every( (update) => allowedUpdates.includes(update))

    if(!validOperations)
        return res.status(400).send({error: 'Invalid Updates!'})

    try{

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        // new is to return the updated data and runValidator is to validate the data as defined before updating
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        res.send(req.user)

    } catch(e){

        res.status(500).send(e)
    }
})
router.delete('/users/me', auth, async (req, res) => {

    try {
        
        // const user = await User.findByIdAndDelete(req.params.id)

        // if(!user)
        //     return res.send(404).send()

        // res.send(user)

        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (error) {
        
        res.status(500).send(error)
    }
})

const upload = multer({
    limits: {

        fileSize: 1000000
    },
    fileFilter(req, file, cb){

        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)){
            return cb(new Error('Please upload jpeg, jpg and png file only'))
        }
        cb(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const image = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = image
    await req.user.save()
    res.send()

}, (error, req, res, next) => {

    res.status(400).send({error: error.message})
})

router.get('/users/:id/avatar', async (req, res) => {

    try {
    
        const user = await User.findById(req.params.id)


        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (error) {
        res.status(404).send()
    }
    
    
})
router.delete('/users/me/avatar', auth, async (req, res) => {

    try{
        
        req.user.avatar = undefined
        await req.user.save()
        res.send()

    } catch (e){

        res.status(500).send()
    }
    
})

module.exports = router