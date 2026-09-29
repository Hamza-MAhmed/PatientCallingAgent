async function fetchPatients() {
  const tbody = document.getElementById("patient-list");
  try {
    const res = await fetch("/patients");
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const json = await res.json();

    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b;">No patients found in database.</td></tr>`;
      return;
    }

    json.data.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${p.first_name || ""} ${p.last_name || ""}</strong></td>
        <td>${p.date_of_birth || "-"}</td>
        <td><span class="badge">${p.sex || "-"}</span></td>
        <td>${p.phone_number || "-"}</td>
        <td>${p.address_line_1 || ""}${p.address_line_2 ? ', ' + p.address_line_2 : ''}, ${p.city || ""}, ${p.state || ""} ${p.zip_code || ""}</td>
        <td>${p.insurance_provider ? p.insurance_provider + (p.insurance_member_id ? ' (' + p.insurance_member_id + ')' : '') : '<span style="color:#94a3b8">None</span>'}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; font-weight: 500;">Failed to load records: ${err.message}</td></tr>`;
  }
}

// Initial fetch on load
fetchPatients();

// Attach button click event listener directly without inline onclick
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", fetchPatients);
}