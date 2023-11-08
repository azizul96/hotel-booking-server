require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.13lfhki.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleware
const verifyToken = async(req, res, next)=>{
  const token = req?.cookies?.token
  // console.log('value of token ', token);
  if(!token){
      return res.status(401).send({message: 'Not Authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      // console.log(err);
      return res.status(401).send({message: 'Not Authorized'})
    }
    // console.log('value in the token', decoded);
    req.user = decoded
    next()
  })
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const roomsCollection = client.db("hotelBookingDB").collection("rooms");
    const bookingsCollection = client.db("hotelBookingDB").collection("bookings");
    const reviewsCollection = client.db("hotelBookingDB").collection("reviews");

    // Jwt
    app.post('/jwt', async(req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Adjust based on your requirements
        // maxAge: // how much time the cookie will exist
    })
      .send({success: true})
    })

    app.post('/logout', async(req, res)=>{
      const user = req.body
      res.clearCookie('token',{maxAge: 0}).send({success: true})
    })

// http://localhost:5000/rooms?sortField=price&sortOrder=asc
    // Rooms
    app.get('/rooms', async(req, res)=>{
      let sortObj = {}
      const sortField = req.query.sortField
      const sortOrder = req.query.sortOrder

      if(sortField && sortOrder){
        sortObj[sortField] = sortOrder
      }
      const result = await roomsCollection.find().sort(sortObj).toArray()
      res.send(result)
    })

    // Bookings
    app.get('/bookings', verifyToken, async(req, res)=>{

      if(req.query.email !== req.user.email){
        return res.status(403).send({message: "Forbidden"})
      }
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingsCollection.find(query).toArray()
      res.send(result)
    })
    
    
    app.post('/bookings', async(req, res)=>{
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
    })
    
    app.patch('/bookings/:id', async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      console.log(filter);
      const options = {upsert: true}
      const updatedDate = req.body
      const updateDoc = {
          $set:{
            date:updatedDate.date, 
          }
      } 
      const result = await bookingsCollection.updateOne(filter, updateDoc, options)
      res.send(result)
  })

    app.delete('/bookings/:id', async(req, res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)}
      const result = await bookingsCollection.deleteOne(query)
      res.send(result)
    })

    // Reviews
    app.get('/reviews', async(req, res)=>{
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })

    app.post('/reviews', async(req, res)=>{
      const review = req.body
      const result = await reviewsCollection.insertOne(review)
      res.send(result)
    })

    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hotel Booking app is running !')
  })
  
app.listen(port, () => {
    console.log(`Hotel Booking app running on port ${port}`)
  })