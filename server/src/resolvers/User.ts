import { Context } from '../utils'

export const User = {
  async getUserById(parent, { id }, ctx: Context) {
    const result = await ctx.fauna.query(
      ctx.query.Get(
        ctx.query.Ref(
          ctx.query.Collection("User"), id)));
    console.log(result);
    return result;
  }
}