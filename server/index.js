const mongoose = require('mongoose');;
const keys = require('./config/keys');

const { app } = require('./app');

const start = async () => {
  if (!keys.mongoURI) {
    throw new Error('MONGO_URI must be defined');
  }
  if (!keys.googleClientID) {
    throw new Error('googleClientID must be defined');
  }
  if (!keys.googleClientSecret) {
    throw new Error('googleClientSecret must be defined');
  }
  if (!keys.cookieKey) {
    throw new Error('cookieKey must be defined');
  }

  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to MongoDb');
  } catch (err) {
    console.error(err);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Listening on port`, PORT);
  });
};

start();
