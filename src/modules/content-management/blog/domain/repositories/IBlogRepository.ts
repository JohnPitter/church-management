// Domain Repository Interface - Blog
// Defines the contract for blog data operations

import { BlogPost, Comment, Like } from '../entities/BlogPost';

export interface IBlogRepository {
  // Post operations
  findById(id: string): Promise<BlogPost | null>;
  findAll(): Promise<BlogPost[]>;
  findPublished(): Promise<BlogPost[]>;
  findByAuthor(authorId: string): Promise<BlogPost[]>;
  findByCategory(category: string): Promise<BlogPost[]>;
  findByTag(tag: string): Promise<BlogPost[]>;
  search(query: string): Promise<BlogPost[]>;
  create(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost>;
  update(id: string, data: Partial<BlogPost>): Promise<BlogPost>;
  delete(id: string): Promise<void>;
  
  // Post interactions
  incrementViews(id: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  hasUserLiked(postId: string, userId: string): Promise<boolean>;
  
  // Comments
  findComments(postId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment>;
  updateComment(id: string, data: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  likeComment(commentId: string, userId: string): Promise<void>;
  unlikeComment(commentId: string, userId: string): Promise<void>;
  
  // Analytics
  getPopularPosts(limit?: number): Promise<BlogPost[]>;
  getRecentPosts(limit?: number): Promise<BlogPost[]>;
  getPostStats(postId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
  }>;
}
