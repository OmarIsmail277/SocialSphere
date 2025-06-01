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

    // const userPosts = posts.filter((post) => post.userId === user.id);
    const allPosts = posts;
    document.getElementById("userName").textContent = user.name;

    const postsFeed = document.querySelector(".posts-feed");
    postsFeed.innerHTML = ""; // Clear old content

    allPosts.reverse().forEach((post) => {
      const postElement = document.createElement("div");
      postElement.className = "post";
      postElement.innerHTML = `
        <div class="post__header">
        

          <img src= "${
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
      `;
      postsFeed.appendChild(postElement);
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

document.addEventListener("DOMContentLoaded", () => {
  renderPosts();
});

const logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedInUser"); // Clear user session
  window.location.href = "login.html"; // Redirect to login page
});
