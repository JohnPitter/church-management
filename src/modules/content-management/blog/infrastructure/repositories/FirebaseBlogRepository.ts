// Data Repository - Firebase Blog Implementation
// Implements blog operations using Firebase Firestore

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  Timestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IBlogRepository } from '../../domain/repositories/IBlogRepository';
import { BlogPost, Comment, PostStatus, PostVisibility, CommentStatus } from '../../domain/entities/BlogPost';

export class FirebaseBlogRepository implements IBlogRepository {
  private readonly postsCollection = 'blogPosts';
  private readonly commentsCollection = 'comments';
  private readonly likesCollection = 'likes';

  // Convert Firestore document to BlogPost
  private documentToBlogPost(doc: any): BlogPost {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      author: data.author,
      categories: data.categories || [],
      tags: data.tags || [],
      status: data.status,
      visibility: data.visibility,
      featuredImage: data.featuredImage,
      publishedAt: data.publishedAt?.toDate(),
      likes: data.likes || 0,
      views: data.views || 0,
      commentsEnabled: data.commentsEnabled !== false,
      isHighlighted: data.isHighlighted || false,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }

  // Convert BlogPost to Firestore document
  private blogPostToDocument(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      categories: post.categories,
      tags: post.tags,
      status: post.status,
      visibility: post.visibility,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
      likes: post.likes,
      views: post.views,
      commentsEnabled: post.commentsEnabled,
      isHighlighted: post.isHighlighted,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  }

  // Convert Firestore document to Comment
  private documentToComment(doc: any): Comment {
    const data = doc.data();
    return {
      id: doc.id,
      postId: data.postId,
      author: data.author,
      content: data.content,
      parentId: data.parentId,
      likes: data.likes || 0,
      status: data.status,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }

  async findById(id: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, this.postsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.documentToBlogPost(docSnap);
    } catch (error) {
      console.error('Error finding blog post by ID:', error);
      throw new Error('Failed to find blog post');
    }
  }

  async findAll(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error finding all blog posts:', error);
      throw new Error('Failed to load blog posts');
    }
  }

  async findPublished(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('status', '==', PostStatus.Published)
      );
      const querySnapshot = await getDocs(q);
      
      const posts = querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
      
      // Sort by publishedAt in descending order in the application
      return posts.sort((a, b) => {
        if (!a.publishedAt || !b.publishedAt) return 0;
        return b.publishedAt.getTime() - a.publishedAt.getTime();
      });
    } catch (error) {
      console.error('Error finding published blog posts:', error);
      throw new Error('Failed to load published blog posts');
    }
  }

  async findByAuthor(authorId: string): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('author.id', '==', authorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error finding blog posts by author:', error);
      throw new Error('Failed to load author blog posts');
    }
  }

  async findByCategory(category: string): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('categories', 'array-contains', category),
        where('status', '==', PostStatus.Published),
        orderBy('publishedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error finding blog posts by category:', error);
      throw new Error('Failed to load blog posts by category');
    }
  }

  async findByTag(tag: string): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('tags', 'array-contains', tag),
        where('status', '==', PostStatus.Published),
        orderBy('publishedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error finding blog posts by tag:', error);
      throw new Error('Failed to load blog posts by tag');
    }
  }

  async search(searchQuery: string): Promise<BlogPost[]> {
    try {
      // Firebase doesn't have full-text search, so we'll implement a basic search
      // In production, you might want to use Algolia or similar service
      const q = query(
        collection(db, this.postsCollection),
        where('status', '==', PostStatus.Published),
        orderBy('publishedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const allPosts = querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
      const searchTerm = searchQuery.toLowerCase();
      
      return allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching blog posts:', error);
      throw new Error('Failed to search blog posts');
    }
  }

  async create(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    try {
      const docData = this.blogPostToDocument(post);
      const docRef = await addDoc(collection(db, this.postsCollection), docData);
      
      const createdDoc = await getDoc(docRef);
      return this.documentToBlogPost(createdDoc);
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }
  }

  async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    try {
      const docRef = doc(db, this.postsCollection, id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
        ...(data.publishedAt && { publishedAt: Timestamp.fromDate(data.publishedAt) })
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      return this.documentToBlogPost(updatedDoc);
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw new Error('Failed to update blog post');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.postsCollection, id));
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw new Error('Failed to delete blog post');
    }
  }

  async incrementViews(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.postsCollection, id);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view tracking
    }
  }

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const likeData = {
        userId,
        targetId: postId,
        targetType: 'post' as const,
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, this.likesCollection), likeData);
      
      // Increment like count on post
      const postRef = doc(db, this.postsCollection, postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.likesCollection),
        where('userId', '==', userId),
        where('targetId', '==', postId),
        where('targetType', '==', 'post')
      );
      const querySnapshot = await getDocs(q);
      
      // Delete like document
      querySnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      // Decrement like count on post
      const postRef = doc(db, this.postsCollection, postId);
      await updateDoc(postRef, {
        likes: increment(-1)
      });
    } catch (error) {
      console.error('Error unliking post:', error);
      throw new Error('Failed to unlike post');
    }
  }

  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.likesCollection),
        where('userId', '==', userId),
        where('targetId', '==', postId),
        where('targetType', '==', 'post')
      );
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if user liked post:', error);
      return false;
    }
  }

  async findComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, this.commentsCollection),
        where('postId', '==', postId),
        where('status', '==', CommentStatus.Approved),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToComment(doc));
    } catch (error) {
      console.error('Error finding comments:', error);
      throw new Error('Failed to load comments');
    }
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    try {
      const docData = {
        ...comment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.commentsCollection), docData);
      const createdDoc = await getDoc(docRef);
      
      return this.documentToComment(createdDoc);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async updateComment(id: string, data: Partial<Comment>): Promise<Comment> {
    try {
      const docRef = doc(db, this.commentsCollection, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await getDoc(docRef);
      return this.documentToComment(updatedDoc);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  async deleteComment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.commentsCollection, id));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    try {
      const likeData = {
        userId,
        targetId: commentId,
        targetType: 'comment' as const,
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, this.likesCollection), likeData);
      
      // Increment like count on comment
      const commentRef = doc(db, this.commentsCollection, commentId);
      await updateDoc(commentRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.likesCollection),
        where('userId', '==', userId),
        where('targetId', '==', commentId),
        where('targetType', '==', 'comment')
      );
      const querySnapshot = await getDocs(q);
      
      // Delete like document
      querySnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      
      // Decrement like count on comment
      const commentRef = doc(db, this.commentsCollection, commentId);
      await updateDoc(commentRef, {
        likes: increment(-1)
      });
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw new Error('Failed to unlike comment');
    }
  }

  async getPopularPosts(limit: number = 10): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('status', '==', PostStatus.Published),
        orderBy('likes', 'desc'),
        orderBy('views', 'desc'),
        firestoreLimit(limit)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error getting popular posts:', error);
      throw new Error('Failed to load popular posts');
    }
  }

  async getRecentPosts(limit: number = 10): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.postsCollection),
        where('status', '==', PostStatus.Published),
        orderBy('publishedAt', 'desc'),
        firestoreLimit(limit)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.documentToBlogPost(doc));
    } catch (error) {
      console.error('Error getting recent posts:', error);
      throw new Error('Failed to load recent posts');
    }
  }

  async getPostStats(postId: string): Promise<{ views: number; likes: number; comments: number; }> {
    try {
      const postDoc = await getDoc(doc(db, this.postsCollection, postId));
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Count comments
      const commentsQuery = query(
        collection(db, this.commentsCollection),
        where('postId', '==', postId),
        where('status', '==', CommentStatus.Approved)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      return {
        views: postData.views || 0,
        likes: postData.likes || 0,
        comments: commentsSnapshot.size
      };
    } catch (error) {
      console.error('Error getting post stats:', error);
      throw new Error('Failed to load post stats');
    }
  }

}
