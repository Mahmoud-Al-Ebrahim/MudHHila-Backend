const express = require('express')
const app = express()
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const AuthRoute = require('./routes/auth');
const hallRoutes = require("./routes/hall.routes");
const eventRoutes = require("./routes/event.routes");
const paymentRoutes = require("./routes/payment.routes");
const reportRoutes = require("./routes/report.routes");
const hallExpenseRoutes = require("./routes/hallExpense.routes");
const cors = require('cors');


dotenv.config();

mongoose.connect(process.env.MONGOURL)
    .then(() => console.log("DataBase Connected!!!"))
    .catch((err) => console.log(err));


// Cross-Origin Resource Sharing "cors"
app.use(cors({
  origin: '*', 
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", AuthRoute);
app.use("/api/halls", hallRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/hall-expenses", hallExpenseRoutes);



// Mongo DB -> NoSQL DB (Document "JSON Objects" and not Tables)
// every site has an ip represent its server

// Domain is the ip Name for a site

// DNS ( Domain Name Service)

// localhost 127.0.0.1
app.listen(process.env.PORT || 6013, () => console.log(`Backend is running on ${process.env.PORT}`))