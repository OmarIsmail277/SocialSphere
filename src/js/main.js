const postInput = document.getElementById("post-content");
const postButton = document.getElementById("post-submit-btn");
const user = JSON.parse(localStorage.getItem("loggedInUser"));

const form = document.getElementById("createPostForm");

const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}`;

const createPostImage = document.getElementById("imgCreatePost");
const mainStoryImage = document.getElementById("mainStoryImg");

createPostImage.src = avatarUrl;
mainStoryImage.src = avatarUrl;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const content = postInput.value.trim();
  const imageInput = document.getElementById("post-image");

  if (!content) {
    alert("Please write something!");
    return;
  }

  let base64Image = null;
  if (imageInput.files && imageInput.files[0]) {
    base64Image = await toBase64(imageInput.files[0]);
  }

  const post = {
    userId: user.id,
    user: user.name,
    content,
    image: base64Image,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(
      "https://magenta-helpful-march.glitch.me/posts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Post added:", data);
      postInput.value = ""; // Clear input
      imageInput.value = ""; // clear file
      await renderPosts(data);
    } else {
      console.error("Failed to create post");
    }
  } catch (error) {
    console.error("Error posting:", error);
  }
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderPosts() {
  try {
    const response = await fetch(
      "https://magenta-helpful-march.glitch.me/posts"
    );
    const posts = await response.json();

    const allPosts = posts;
    document.getElementById("userName").textContent = user.name;

    const postsFeed = document.querySelector(".posts-feed");
    postsFeed.innerHTML = ""; // Clear old content

    allPosts.reverse().forEach((post) => {
      const postElement = document.createElement("div");
      postElement.className = "post";
      postElement.innerHTML = `
        <div class="post__header">
          <a href="post.html?id=${post.id}" class="view-post-btn">View Details</a>
          <img src="${
            post.userId === user.id
              ? `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}`
              : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${post.userId}`
          }"  alt="User Avatar" class="post__avatar" />
          <div class="post__user-info">
            <h4 class="post__username">${post.user}</h4>
            <p class="post__timestamp">${new Date(
              post.timestamp
            ).toLocaleString()}</p>
          </div>
        </div>
        <div class="post__content">
          <p>${post.content}</p>
          ${
            post.image
              ? `<img src="${post.image}" alt="Post Image" class="post__image" />`
              : ""
          }
        </div>
        <div class="post__actions">
          <button class="post__action-btn like-btn"><i class="fa-regular fa-thumbs-up"></i> Like</button>
          <button class="post__action-btn comment-btn"><i class="fa-regular fa-comment"></i> Comment</button>
          <button class="post__action-btn share-btn"><i class="fa-regular fa-share-from-square"></i> Share</button>
          ${
            post.userId === user.id
              ? `<button class="post__action-btn edit-btn" data-id="${post.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                <button class="post__action-btn delete-btn" data-id="${post.id}"><i class="fa-solid fa-trash"></i> Delete</button>`
              : ""
          }
        </div>
        <div class="comments-section" data-post-id="${post.id}">
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
        </div>
      `;
      postsFeed.appendChild(postElement);

      // Setup comment form for this post
      const commentForm = postElement.querySelector('.comment-form');
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = commentForm.querySelector('.comment-input');
        const content = input.value.trim();

        if (!content) return;

        try {
          await addComment(post.id, content);
          input.value = '';
          await renderComments(post.id);
        } catch (error) {
          alert('Failed to add comment. Please try again.');
        }
      });

      // Load comments for this post
      renderComments(post.id);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.dataset.id;

        if (confirm("Are you sure you want to delete this post?")) {
          try {
            const res = await fetch(
              `https://magenta-helpful-march.glitch.me/posts/${postId}`,
              {
                method: "DELETE",
              }
            );
            if (res.ok) {
              await renderPosts(); // Re-render posts after deletion
            } else {
              alert("Failed to delete post");
            }
          } catch (err) {
            console.error("Delete error:", err);
          }
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.dataset.id;
        const newContent = prompt("Edit your post:");

        if (newContent !== null && newContent.trim()) {
          try {
            const res = await fetch(
              `https://magenta-helpful-march.glitch.me/posts/${postId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent.trim() }),
              }
            );
            if (res.ok) {
              await renderPosts(); // Re-render posts after editing
            } else {
              alert("Failed to update post");
            }
          } catch (err) {
            console.error("Edit error:", err);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading posts:", error);
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
    // First, get the post to check if it exists and get current comments
    const postResponse = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`);
    if (!postResponse.ok) {
      throw new Error('Post not found');
    }
    const post = await postResponse.json();
    const currentComments = post.comments || [];

    // Then add the new comment to the existing comments array
    const response = await fetch(`https://magenta-helpful-march.glitch.me/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        comments: [...currentComments, comment] // Append the new comment to existing comments
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

document.addEventListener("DOMContentLoaded", () => {
  renderPosts();
});

const logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedInUser"); // Clear user session
  window.location.href = "login.html"; // Redirect to login page
});
