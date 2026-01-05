// Domain Entity - BlogPost
// Represents blog posts with business rules

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: Author;
  categories: string[];
  tags: string[];
  status: PostStatus;
  visibility: PostVisibility;
  featuredImage?: string;
  publishedAt?: Date;
  likes: number;
  views: number;
  commentsEnabled: boolean;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  photoURL?: string;
  role: string;
}

export enum PostStatus {
  Draft = 'draft',
  Published = 'published',
  Scheduled = 'scheduled',
  Archived = 'archived'
}

export enum PostVisibility {
  Public = 'public',
  MembersOnly = 'members_only',
  Private = 'private'
}

export interface Comment {
  id: string;
  postId: string;
  author: CommentAuthor;
  content: string;
  parentId?: string; // For nested comments
  likes: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentAuthor {
  id: string;
  name: string;
  photoURL?: string;
}

export enum CommentStatus {
  Approved = 'approved',
  Pending = 'pending',
  Spam = 'spam',
  Deleted = 'deleted'
}

export interface Like {
  userId: string;
  targetId: string; // postId or commentId
  targetType: 'post' | 'comment';
  createdAt: Date;
}

// Business Rules
export class BlogPostEntity {
  static isPublished(post: BlogPost): boolean {
    return post.status === PostStatus.Published && 
           (!post.publishedAt || post.publishedAt <= new Date());
  }

  static isScheduled(post: BlogPost): boolean {
    return post.status === PostStatus.Scheduled && 
           !!post.publishedAt && 
           post.publishedAt > new Date();
  }

  static canView(post: BlogPost, userRole?: string): boolean {
    if (post.visibility === PostVisibility.Public) {
      return this.isPublished(post);
    }

    if (post.visibility === PostVisibility.MembersOnly) {
      return this.isPublished(post) && !!userRole;
    }

    if (post.visibility === PostVisibility.Private) {
      return userRole === 'admin' || userRole === 'secretary';
    }

    return false;
  }

  static canEdit(post: BlogPost, userId: string, userRole: string): boolean {
    if (userRole === 'admin') return true;
    if (userRole === 'secretary') return true;
    return post.author.id === userId;
  }

  static canComment(post: BlogPost): boolean {
    return post.commentsEnabled && this.isPublished(post);
  }

  static generateExcerpt(content: string, maxLength: number = 150): string {
    const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    if (plainText.length <= maxLength) return plainText;
    
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return truncated.substring(0, lastSpace) + '...';
  }

  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    
    return Math.ceil(wordCount / wordsPerMinute);
  }

  static validateTitle(title: string): boolean {
    return title.length >= 3 && title.length <= 100;
  }

  static validateContent(content: string): boolean {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length >= 10;
  }

  static sortByDate(posts: BlogPost[], ascending: boolean = false): BlogPost[] {
    return [...posts].sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      
      if (ascending) {
        return dateA.getTime() - dateB.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });
  }

  static filterByCategory(posts: BlogPost[], category: string): BlogPost[] {
    return posts.filter(post => post.categories.includes(category));
  }

  static searchPosts(posts: BlogPost[], query: string): BlogPost[] {
    const lowerQuery = query.toLowerCase();
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}
