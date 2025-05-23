const BASE_URL = "http://localhost:3000/users";

// Register user
export async function registerUser(userData) {
  const resposne = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return resposne.json();
}

// Login user
export async function loginUser(email, password) {
  const response = await fetch(
    `${BASE_URL}?email=${email}&password=${password}`
  );
  const data = await response.json();
  return data.length > 0 ? data[0] : null;
}
