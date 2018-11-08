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
  }
};

module.exports = Mutation;
