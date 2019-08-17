const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRoute = require('./routers/task')

const port = process.env.PORT
const app = express()

// app.use((req, res, next) => {

//     if(req.method === 'GET')
//         res.send('The GET request is disabled')
//     else
//         next()
// })

// app.use((req, res, next) => {

//     res.status(503).send('The server is under maintainance')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRoute)

app.listen(port, () => {

    console.log("Server is up on port " + port)

})

