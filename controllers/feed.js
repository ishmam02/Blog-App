const fs = require('fs');
const path = require('path')

const { validationResult } = require('express-validator');
const Post = require('../models/posts')
const User = require('../models/user');
const user = require('../models/user');
const { use } = require('../routes/feed');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find().countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find().skip((currentPage - 1) * perPage).limit(perPage);
    })
    .then( result => {
    res.status(200).json({posts: result, totalItems: totalItems})}
    ) 
    .catch( err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err)
    })
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty){
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  if(!req.file){
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\" ,"/");
  let creator;
  const post = new Post({
    title: title, 
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  post.save().then(result => {
    return User.findById(req.userId);
  }).then( user => {
      creator = user
      user.posts.push(post)
      return user.save();
  })
  .then( result => {
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: creator._id, name: creator.name }
    });
  })
  .catch(err =>{
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err)
  });
  
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then( result => {
      if(!result){
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({post: result});
    })
    .catch( err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err)
    })
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty){
    const error = new Error('Validation failed');
    error.data = errors.array();
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.body.image;
  if(req.file){
    imageUrl = req.file.path.replace("\\" ,"/");
  }
  if(!imageUrl){
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
      .then(result => {
        if(!result){
          const error = new Error('Could not find post');
          error.statusCode = 404;
          throw error;
        }
        if(result.creator.toString() !== req.userId){
          const error = new Error('Not Authenticated');
          error.statusCode = 403;
          throw error;
        }
        if( imageUrl !== result.imageUrl ){
          clearImage(result.imageUrl)
        }
        result.title = title;
        result.content = content;
        result.imageUrl = imageUrl;
        return result.save();
      })
      .then(result => {
        res.status(200).json({post: result})
      })
      .catch(err => {
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err)
      })

}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(result => {
      if(!result){
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if(result.creator.toString() !== req.userId){
        const error = new Error('Not Authenticated');
        error.statusCode = 403;
        throw error;
      }
      clearImage(result.imageUrl)
      return Post.findByIdAndRemove(postId);
    })
    .then( res => {
      return User.findById(req.userId);
    })
    .then( user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({message: 'Post deleted'})
    })
    .catch(err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err)
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
} 