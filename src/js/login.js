import { loginUser } from "./api.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = await loginUser(email, password);

  if (user) {
    alert(`Welcome, ${user.name}!`);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.location.href = "../views/home.html"; // 👈 Redirect to home
  } else {
    alert("Invalid email or password");
  }
});
