document.addEventListener("DOMContentLoaded", () => {
  const baseApi = "https://reqres.in/api/users";
  const proxy = "https://corsproxy.io/?";

  const userList = document.getElementById("userList");
  const pagination = document.getElementById("pagination");
  const loader = document.getElementById("loader");
  const searchInput = document.getElementById("searchInput");
  const userForm = document.getElementById("userForm");
  const userIdInput = document.getElementById("userId");
  const nameInput = document.getElementById("name");
  const jobInput = document.getElementById("job");

  let currentPage = 1;
  let totalPages = 1;
  let usersData = [];

  // Fetch users
  async function fetchUsers(page = 1) {
    showLoader(true);
    try {
      const fullUrl = `${proxy}${encodeURIComponent(`${baseApi}?page=${page}`)}`;
      const res = await fetch(fullUrl);
      const data = await res.json();
      usersData = data.data;
      totalPages = data.total_pages;
      renderUsers(usersData);
      renderPagination(page);
    } catch (err) {
      alert("Error fetching users.");
    }
    showLoader(false);
  }

  // Render users
  function renderUsers(users) {
    userList.innerHTML = "";
    users.forEach((user) => {
      const div = document.createElement("div");
      div.className = "user-card";
      div.innerHTML = `
        <img src="${user.avatar}" alt="${user.first_name}">
        <h3>${user.first_name} ${user.last_name}</h3>
        <p>${user.email}</p>
        <div class="actions">
          <button onclick="editUser(${user.id})">Edit</button>
          <button onclick="deleteUser(${user.id})">Delete</button>
        </div>
      `;
      div.addEventListener("click", (e) => {
        if (!e.target.closest("button")) openModal(user);
      });
      userList.appendChild(div);
    });
  }

  // Render pagination
  function renderPagination(page) {
    pagination.innerHTML = `
      <button ${page === 1 ? "disabled" : ""} onclick="changePage(${page - 1})">Prev</button>
      <span>Page ${page}</span>
      <button ${page === totalPages ? "disabled" : ""} onclick="changePage(${page + 1})">Next</button>
    `;
  }

  window.changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      fetchUsers(page);
    }
  };

  // Search
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = usersData.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(term)
    );
    renderUsers(filtered);
  });

  // Add/Edit user
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = userIdInput.value;
    const name = nameInput.value.trim();
    const job = jobInput.value.trim();

    if (!name || !job) return alert("Please enter both name and job.");

    const [first_name, ...rest] = name.split(" ");
    const last_name = rest.join(" ") || "";
    const payload = { name, job };

    try {
      let response, user;

      if (id) {
        // Edit user
        response = await fetch(`${proxy}${encodeURIComponent(`${baseApi}/${id}`)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        user = await response.json();

        const index = usersData.findIndex((u) => u.id == id);
        if (index !== -1) {
          usersData[index].first_name = first_name;
          usersData[index].last_name = last_name;
          usersData[index].job = job;
          renderUsers(usersData);
        }
        alert("User updated!");
      } else {
        // Add user
        response = await fetch(`${proxy}${encodeURIComponent(baseApi)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        user = await response.json();

        const newUser = {
          id: user.id || Date.now(),
          first_name,
          last_name,
          email: `${first_name.toLowerCase()}@reqres.in`,
          avatar: "https://i.pravatar.cc/150?u=" + Date.now(),
        };
        usersData.unshift(newUser);
        renderUsers(usersData);
        alert("User added!");
      }

      userForm.reset();
      userIdInput.value = "";
      document.getElementById("submitBtn").textContent = "Add User";
    } catch {
      alert("Error processing request.");
    }
  });

  // Edit user
  window.editUser = (id) => {
    const user = usersData.find((u) => u.id == id);
    if (!user) return;

    userIdInput.value = id;
    nameInput.value = `${user.first_name} ${user.last_name}`;
    jobInput.value = user.job || "";
    document.getElementById("submitBtn").textContent = "Update User";
  };

  // Delete user
  window.deleteUser = async (id) => {
    try {
      await fetch(`${proxy}${encodeURIComponent(`${baseApi}/${id}`)}`, {
        method: "DELETE",
      });
      usersData = usersData.filter((u) => u.id !== id);
      renderUsers(usersData);
      alert("User deleted!");
    } catch {
      alert("Error deleting user.");
    }
  };

  // Modal
  window.openModal = (user) => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <img src="${user.avatar}" />
        <h2>${user.first_name} ${user.last_name}</h2>
        <p>${user.email}</p>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".close").onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  };

  // Loader toggle
  function showLoader(show) {
    loader.style.display = show ? "block" : "none";
  }

  // Initial load
  fetchUsers();
});
