import { registerUser } from "./api.js";

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value.trim(),
  };

  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  if (user.password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const newUser = await registerUser(user);
  alert("Account Created! Welcome to our family! 🎉🙋‍♂️");
  console.log("here");
  localStorage.setItem("loggedInUser", JSON.stringify(newUser));
});
