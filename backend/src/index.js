require('dotenv').config({ path: 'variables.env' });
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Use express middleware to handle cookies (JWT)
server.express.use(cookieParser());

// Use express middleware to populate the current user's id on each request
server.express.use((req, res, next) => {
  // Decode the JWT so we can get the user ID from each request
  const { token } = req.cookies;
  if(token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET)
    // put the userId into the req for future request to access
    req.userId = userId;
  }
  next();
});

// Use express middleware to populate the user on each request
server.express.use(async (req, res, next) => {
  if(!req.userId) return next();
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{ id, name, email, permissions }'
  );
  req.user = user;
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  (deets) => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);
