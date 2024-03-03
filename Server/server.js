require('dotenv').config();
const express = require('express')
const port = 3000;//process.env.port || 3000;
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const con = require(`${__dirname}/src/db.js`)
const Movies = require(`${__dirname}/models/movies.js`)
const Tags = require(`${__dirname}/models/tags.js`)
const Shows = require(`${__dirname}/models/shows.js`)
const { GraphQLError } = require('graphql');

const startServer = async () => {
  const app = express()
  const server = new ApolloServer({
    typeDefs: `
      type Links{
        quality:String,
        link:String
      },
      type Downloads{
        english:[Links],
        hindi:[Links],
        subbed:[Links]
      },
      type Movie{  
        _id:ID!
        movieName:String!,
        movieDescription:String!,
        movieThumbnail:String!,
        releaseYear:Int!,
        movieDirectors:[String!],
        movieTags:[String!]!,
        movieShots:[String!],
        movieReview:String,
        movieDownloads:Downloads
      },
      type Episode{
        downloads:Downloads,
        episodeId:String!,
        episodeName:String,
        episodeNum:String
      },
      type Show{
        showName:String!,
        seasonNum:String!,
        showDescription:String!,
        showThumbnail:String!,
        showCreators:[String!],
        showTags:[String!],
        showShots:[String!],
        showReview:String,
        showEpisodes:[Episode!]!
      },
      type Tag{
        tagName:String!,
        tagDescription:String!,
        tagMovies:Int,
        tagShows:Int
      },
      type User{
        userName:String!,
        userEmail:String!,
        password:String!
      },
      type Query{
        Movies(year:Int,tag:String,page:Int,limit:Int):[Movie],
        Movie(id:ID,name:String,tag:String):Movie,
        Shows(year:Int,tag:String,page:Int,limit:Int):[Show],
        Show(id:ID,name:String):Show,
        Tags:[Tag],
        Token:String
      },
      input ILinks{
        quality:String,
        link:String
      },
      input IDownloads{
        english:[ILinks],
        hindi:[ILinks],
        subbed:[ILinks]
      },
      input IEpisode{
        downloads:IDownloads,
        episodeId:String!,
        episodeName:String,
        episodeNum:String
      },
      input IMovie{
        _id:ID,
        movieName:String,
        movieDescription:String,
        movieThumbnail:String,
        releaseYear:Int,
        movieDirectors:[String!],
        movieTags:[String!],
        movieShots:[String!],
        movieReview:String,
        movieDownloads:IDownloads
      },
      input IShow{
        showName:String!,
        seasonNum:String!,
        showDescription:String!,
        showThumbnail:String!,
        showCreators:[String!],
        showTags:[String!],
        showShots:[String!],
        showReview:String,
        showEpisodes:[IEpisode!]!
      },
      type Mutation{
        UpdateEpisode(showId:ID,episode:IEpisode):Episode,
        CreateMovie(id:ID,movie:IMovie):Movie,
        CreateShow(id:ID,show:IShow):Show,
        DeleteMovie(id:ID):Movie
      }
    `,
    resolvers: {
      Episode: {
        downloads: async (parent) => {
          // console.log(todo,'hi')
          return todo.downloads;
        }
      },
      Downloads: {
        english: (parent) => {
          return parent.english;
        },
        hindi: (parent) => parent.hindi,
        subbed: (parent) => parent.subbed
      },
      Movie: {
        movieDownloads: async (parent) => {
          let tmp = await Movies.find({
            _id: parent._id,
          })
          return tmp[0].movieDownloads;
        }
      },
      Show: {
        showEpisodes: async (parent) => {
          //console.log(parent._id,'hi')
          let tmp = await Shows.find({
            _id: parent._id,
          })
          //console.log(tmp);
          return tmp[0].showEpisodes;
        }
      },
      Mutation: {
        // Test:async (parent,{showId,tmp})=>{ // just for testing 
        //   const hmp = await Shows.findOneAndUpdate({_id:showId},{
        //     $push:{showCreators:tmp}
        //   })
        //   return hmp;
        // },
        UpdateEpisode: async (parent, { showId, episode }, contextValue) => {
          if (!contextValue.token) throw new Error('You are not authorized to perform this action.');
          if (!showId) throw new Error('showId is required.');
          if (!episode) throw new Error('episode is required.');
          // if(episode) { console.log(episode,typeof episode)}
          const tmp = await Shows.findOneAndUpdate(
            { _id: id },
            {
              $push: { showEpisodes: req.body },
              $set: { date: Date.now() },
            }
          );
          return episode;
        },
        CreateMovie: async (parent, { movie }, contextValue) => { // movie insertion
          if (!contextValue.token) throw new Error('You are not authorized to perform this action.');
          if (!movie) throw new Error('movie is required.');
          const tmp = await Movies.insertMany([movie]);
          const li = movie.movieTags;
          for (let i = 0; i < li.length; i++) {
            let result = await Tags.updateOne(
              { tagName: li[i] },
              {
                $inc: {
                  tagMovies: 1,
                },
              }
            );
            console.log(result);
          }
          return tmp[0];
        },
        CreateShow: async (parent, { show }, contextValue) => { // movie insertion
          if (!contextValue.token) throw new Error('You are not authorized to perform this action.');
          if (!show) throw new Error('show is required.');
          const tmp = await Shows.insertMany([show]);
          const li = movie.movieTags;
          for (let i = 0; i < li.length; i++) {
            let result = await Tags.updateOne(
              { tagName: li[i] },
              {
                $inc: {
                  tagMovies: 1,
                },
              }
            );
            console.log(result);
          }
          return tmp[0];
        },
        DeleteMovie: async (parent, { id }, contextValue) => {
          if (!contextValue.token) throw new Error('You are not authorized to perform this action.');
          if (!id) throw new Error('Id is required.');
          const tmp = Movies.findOneAndDelete({ _id: id });
          const li = tmp.movieTags;
          for (let i = 0; i < li.length; i++) {
            let result = await Tags.updateOne(
              { tagName: li[i] },
              {
                $inc: {
                  tagMovies: -1,
                },
              }
            );
            console.log(result);
          }
          return tmp;
        }
      },
      Query: {
        Movies: async (parent, { year, tag, page, limit }) => {
          console.log(year, typeof year)
          if (page && limit) {
            const Count = await Movies.find().count();
            const Skip = (page - 1) * limit;
            if (Skip < Count) {
              return await Movies.find().skip(Skip).limit(limit).sort({ date: -1 });
            }
          }
          if (year) return await Movies.find({ releaseYear: year })
          if (tag) return await Movies.find({ movieTags: tag });
          return await Movies.find().sort({ date: -1 });
        },
        Movie: async (parent, { id, name, tag }, contextValue) => {
          // console.log(id,name);
          if (id) {
            let tmp = await Movies.find({ _id: id })
            return tmp[0];
          }
          if (name) {
            let tmp = await Movies.find({ movieName: name });
            return tmp[0];
          }
          if (tag) { // random movie with a tag
            tag = tag.toLowerCase();
            let tmp = await Movies.find({ movieTags: tag });
            return tmp[Math.floor(Math.random() * tmp.length)];
          }
          console.log(contextValue);
          // if(!contextValue.token) throw new Error("bug");
          const tmp = await Movies.aggregate([ // random movie
            { $sample: { size: 1 } },
            {
              $project: {
                date: 0,
                __v: 0,
              },
            },
          ]);
          return tmp[0];
        },
        Tags: async () => await Tags.find(),
        Shows: async (parent, { tag, page, limit }) => {
          if (page && limit) {
            const Count = await Shows.find().count();
            const Skip = (page - 1) * limit;
            if (Skip < Count) {
              return await Shows.find().skip(Skip).limit(limit).sort({ date: -1 });
            }
          }
          if (tag) return await Shows.find({ showTags: tag })
          return await Shows.find().sort({ date: -1 });
        },
        Show: async (parent, { id, name }) => {
          if (id) {
            let tmp = await Shows.find({ _id: id })
            return tmp[0];
          }
          if (name) {
            let tmp = await Shows.find({ showName: name });
            return tmp[0];
          }
          const tmp = await Shows.aggregate([
            { $sample: { size: 1 } },
            {
              $project: {
                date: 0,
                __v: 0,
              },
            },
          ]);
          return tmp[0];
        },
        Token: async (parent) => {
          return jwt.sign({ value: "Token is only valid for 20 mins" }, "yeah", {
            expiresIn: "10m"
          });
        }
      },
    },
  });
  // console.log(url)
  app.use(cors());
  app.use(express.json());
  await server.start();
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => {
      const token = req.headers.authorization;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        } catch (error) {
          throw new GraphQLError('Invalid Token !!!', {
            extensions: {
              code: 'FORBIDDEN',
            },
          });
        }
      }
      return { token }
      //if(token.startsWith("Bearer ")) token = token.substring(7);
      // return {token:null}
    }
  }));

  app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/templates/main.html`)
    //res.redirect('/graphql');
    // res.cookie(,process.env.COOKIE_VALUE,)
  })

  app.get('/domain', async (req, res) => {
    let a = req.query.old;
    let b = req.query.new;
    if (!a && !b) return res.sendStatus(400);

    // Remember it works only on string fields not array fields
    // const tmp = await Shows.updateMany({ showThumbnail: { $regex: `/${a}/`}},[{$set: { showThumbnail: {$replaceOne: { input: "$showThumbnail", find: a, replacement: b } }}}])

    console.log(tmp);
    res.redirect('/graphql');
  })

  app.listen(port, async () => {
    await con(process.env.MONGODB_URL);
    console.log('server started');
  })
}
startServer();
// Render Html File
// app.get('/', function(req, res) {
//   res.send('Hello there !!!')
// });

// app.listen(port, () => {
//   // Code.....
//   console.log('server connected !!!')
// })