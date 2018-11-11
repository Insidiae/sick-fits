const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  // equivalent to this code below; particularly helpful if there's no custom logic for your query
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // Check if there is a current user ID
    if(!ctx.request.userId) return null;
    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info);
  },
  async users(parent, args, ctx, info) {
    // Check if user is logged in
    if(!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    // Check if the user has permission to query all the users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    // If user has the needed permission(s), query all the users
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;
