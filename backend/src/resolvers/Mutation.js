const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');

const Mutation = {
  async createItem(parent, args, ctx, info) {
    // Check if user is logged in
    if(!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }

    const item = await ctx.db.mutation.createItem({
      data: {
        // This creates a relationship between the user and the created item
        user: {
          connect: {
            id: ctx.request.userId,
          },
        },
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
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`);
    // Check if the user owns that item, or has the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission));
    if (!ownsItem && !hasPermissions) {
      throw new Error('You do not have permission to delete this item.');
    }
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
  },

  async requestReset(parent, args, ctx, info) {
    // Check if the user with the provided email exists
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if(!user) {
      throw new Error(`No such user found for email: ${args.email}`);
    }
    // Set a reset token and expiry for that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // expires in 1hr
    const res = await ctx.db.mutation.updateUser({
      where: {email: args.email},
      data: { resetToken, resetTokenExpiry },
    });
    // Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'placeholder@email.net',
      to: user.email,
      subject: 'Your Password Reset Token - Sick Fits',
      html: makeANiceEmail(`
        Your password reset token is here!

        <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset your password</a>
      `)
    });

    // Return some message for the frontend
    return { message: 'Password reset request successful!' };
  },

  async resetPassword(parent, {resetToken, password, confirmPassword}, ctx, info) {
    // Check if the passwords match
    if(password !== confirmPassword) {
      throw new Error('Your passwords do not match. Please try again');
    }
    // Check if the reset token is valid and not expired
    // (NOTE: the users query actually gets an array of users.
    // We just use destructuring to get the first returned user.)
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      }
    });
    if(!user) {
      throw new Error('This token is either invalid or expired.');
    }
    // Hash the new password and remove old resetToken fields
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    })
    // Generate JWT
    const token = jwt.sign({userId: updatedUser.id}, process.env.APP_SECRET);
    // Set JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    // Return the new user
    return updatedUser;
  },

  async updatePermissions(parent, args, ctx, info) {
    // Check if user is logged in
    if(!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    // Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        }
      },
      info
    );
    // Check if the user has permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // Update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info
    );
  },

  async addToCart(parent, args, ctx, info) {
    // Make sure the user in signed in
    const { userId } = ctx.request;
    if(!userId) {
      throw new Error('You must be logged in to do that!');
    }
    // Query the user's current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });
    // Check if the item is already in their cart
    if(existingCartItem){
      // if the item is already in the cart, just increment the quantity
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      );
    }
      // if the item isn't in the cart, create a fresh CartItem for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },

  async removeFromCart(parent, args, ctx, info) {
    // Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        },
      },
      `{ id, user { id } }`
    );
    if (!cartItem) {
      throw new Error('You do not have this item in your cart.');
    }
    // Make sure user owns said cart item
    if(cartItem.user.id !== ctx.request.userId) {
      throw new Error('You do not have this item in your cart.');
    }
    // Delete that cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id },
      },
      info
    );
  },
};

module.exports = Mutation;
