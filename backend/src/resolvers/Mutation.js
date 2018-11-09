const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutation = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if user is logged in

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  },

  async updateItem(parent, args, ctx, info) {
    // First, take a copy of the updates
    const updates = { ...args };
    // Remove the ID from the updates
    delete updates.id;
    // Run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        },
      },
      info
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // Find the item
    const item = await ctx.db.query.item({ where }, `{ id title }`);
    // Check if the user owns that item, or has the permissions
    // TODO
    // Delete the item
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    // Lowercase the user's email
    const email = args.email.toLowerCase();
    // Hash their password
    const password = await bcrypt.hash(args.password, 10);
    // Add the user to the db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          email,
          password,
          permissions: { set: ['USER'] },
        }
      },
      info
    );
    // Create the JWT for the user
    // This is so they can be immediately signed in upon registering
    const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
    // Set the JWT as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the user to the browser
    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    // Chech if there's a user with that email
    const user = await ctx.db.query.user({where: { email }})
    if(!user) {
      throw new Error(`No such user found for email: ${email}`);
    }
    // c=Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!')
    }
    // Generate the JWT token
    const token = jwt.sign({userId: user.id}, process.env.APP_SECRET)
    // Set the cookie with the generated token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the user
    return user;
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Signed out!' };
  }
};

module.exports = Mutation;
