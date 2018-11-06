const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db')
  // equivalent to this code below; particularly helpful if there's no custom logic for your query
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
