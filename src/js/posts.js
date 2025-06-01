// Get the post ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// DOM Elements
const postDetailsContent = document.querySelector('.post-details-content');

// Get current user
const user = JSON.parse(localStorage.getItem('loggedInUser'));

// Load post details
async function loadPostDetails() {
  if (!postId) {
    window.location.href = 'home.html';
    return;
  }

  try {
    const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    const post = await response.json();

    // Render post details
    renderPostDetails(post);
  } catch (error) {
    console.error('Error loading post:', error);
    window.location.href = 'home.html';
  }
}

// Add comment to a post
async function addComment(postId, content) {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const comment = {
    userId: user.id,
    user: user.name,
    content,
    timestamp: new Date().toISOString()
  };

  try {
    // First, get the post to check if it exists
    const postResponse = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`);
    if (!postResponse.ok) {
      throw new Error('Post not found');
    }

    // Then add the comment
    const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        comments: [comment] // Add the new comment to the post's comments array
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Load comments for a post
async function loadComments(postId) {
  try {
    const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`);
    if (!response.ok) {
      throw new Error('Failed to load post');
    }
    const post = await response.json();
    return post.comments || []; // Return the comments array or empty array if none exist
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

// Render comments section
function renderCommentsSection(postId) {
  const commentsSection = document.createElement('div');
  commentsSection.className = 'comments-section';
  commentsSection.setAttribute('data-post-id', postId);
  commentsSection.innerHTML = `
    <h3>Comments</h3>
    <form class="comment-form">
      <div class="comment-input-container">
        <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}" alt="User Avatar" class="comment-avatar" />
        <input type="text" class="comment-input" placeholder="Write a comment..." />
        <button type="submit" class="comment-submit">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </form>
    <div class="comments-list"></div>
  `;

  // Add comment form submission handler
  const commentForm = commentsSection.querySelector('.comment-form');
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = commentForm.querySelector('.comment-input');
    const content = input.value.trim();

    if (!content) return;

    try {
      await addComment(postId, content);
      input.value = '';
      await renderComments(postId);
    } catch (error) {
      alert('Failed to add comment. Please try again.');
    }
  });

  return commentsSection;
}

// Render individual comments
async function renderComments(postId) {
  const commentsList = document.querySelector(`.comments-section[data-post-id="${postId}"] .comments-list`);
  if (!commentsList) return;

  try {
    const comments = await loadComments(postId);
    commentsList.innerHTML = comments.map(comment => `
      <div class="comment">
        <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${comment.userId}" alt="User Avatar" class="comment-avatar" />
        <div class="comment-content">
          <div class="comment-header">
            <h4>${comment.user}</h4>
            <span>${new Date(comment.timestamp).toLocaleString()}</span>
          </div>
          <p>${comment.content}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error rendering comments:', error);
  }
}

// Render post details
function renderPostDetails(post) {
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${post.userId}`;
  
  const postHTML = `
    <div class="post">
      <div class="post__header">
        <img src="${avatarUrl}" alt="${post.user}" class="post__avatar" />
        <div class="post__user-info">
          <h4 class="post__username">${post.user}</h4>
          <p class="post__timestamp">${new Date(post.timestamp).toLocaleString()}</p>
        </div>
      </div>
      <div class="post__content">
        <p>${post.content}</p>
        ${post.image ? `<img src="${post.image}" alt="Post Image" class="post__image" />` : ''}
      </div>
      <div class="post__actions">
        <button class="post__action-btn like-btn"><i class="fa-regular fa-thumbs-up"></i> Like</button>
        <button class="post__action-btn comment-btn"><i class="fa-regular fa-comment"></i> Comment</button>
        <button class="post__action-btn share-btn"><i class="fa-regular fa-share-from-square"></i> Share</button>
        ${post.userId === user.id ? `
          <button class="post__action-btn edit-btn" data-id="${post.id}">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="post__action-btn delete-btn" data-id="${post.id}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        ` : ''}
      </div>
    </div>
  `;

  postDetailsContent.innerHTML = postHTML;
  
  // Add comments section
  const commentsSection = renderCommentsSection(post.id);
  postDetailsContent.appendChild(commentsSection);
  
  // Load and render comments
  renderComments(post.id);
  
  setupPostActions();
}

// Setup post actions (edit, delete)
function setupPostActions() {
  const editBtn = document.querySelector('.edit-btn');
  const deleteBtn = document.querySelector('.delete-btn');

  if (editBtn) {
    editBtn.addEventListener('click', async () => {
      const newContent = prompt('Edit your post:');
      if (newContent !== null && newContent.trim()) {
        try {
          const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent.trim() })
          });

          if (response.ok) {
            loadPostDetails(); // Reload post after editing
          } else {
            throw new Error('Failed to update post');
          }
        } catch (error) {
          console.error('Edit error:', error);
          alert('Failed to update post. Please try again.');
        }
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            window.location.href = 'home.html'; // Redirect to home after deletion
          } else {
            throw new Error('Failed to delete post');
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('Failed to delete post. Please try again.');
        }
      }
    });
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  loadPostDetails();
});
