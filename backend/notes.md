# Notes/Trivia that Might Be Important Later On

- GraphQL is not really a "query language" per se (it doesn't come with the filtering/matching logic that you might expect)
- Prisma adds all those filtering/matching logic under the hood (which is why the generated prisma.graphql file gets really large as we build more complex data models)
- the `graphql get-schema -p prisma` post-deploy hook gets the updated version of the GraphQL schema that we have on our Prisma Server.
- Prisma also lets us do imports in .graphql files:
  - `# import * from 'path/to/file.graphql'` imports the types/inputs from the external .graphql file as needed

# Backend: Adding New Pieces of Data

### You'll need to edit three/four different files:

1. Edit the Data Model (`datamodel.prisma`)
2. Deploy the Data Model to Prisma whenever it's updated (generates an updated `prisma.graphql` via our post-deploy hook)
3. Edit Schema for GraphQL Yoga (`src/schema.graphql`)
4. Write Resolvers (`src/resolvers/`)

# The Different Kinds of .graphql Files

- `datamodel.prisma` - to be deployed to Prisma
- `prisma.graphql` - generated by Prisma based off the `datamodel.prisma` we deployed
- `schema.graphql` - public-facing API our JS code will be interfacing with
