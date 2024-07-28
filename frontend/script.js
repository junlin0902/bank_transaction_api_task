async function init(name) {
  await Promise.all([createAdminTable(name)]).then(
    function(values) {
      createAddForm(name);
      createViewTable(name);
    }
  );
}

async function createAdminTable(name) {
  return fetch('http://127.0.0.1:5000/'.concat(name))
    .then(response => response.json())
    .then(data => {
      const table = document.getElementById(name.concat('-table'));
      const headerRow = document.createElement('tr');
      Object.keys(data[0]).forEach(key => {
          const th = document.createElement('th');
          th.appendChild(document.createTextNode(key));
          headerRow.appendChild(th);
      });
      headerRow.id = name.concat("-fields");
      table.appendChild(headerRow);

      let counter = 0;
      data.forEach(item => {
          const row = document.createElement('tr');
          Object.values(item).forEach(value => {
              const td = document.createElement('td');
              td.appendChild(document.createTextNode(value));
              row.appendChild(td);
          });
          if (name != "transaction") {
              const td = document.createElement('td');
              const button = document.createElement('button');
              button.append("EDIT");
              button.className = "btn-edit";
              let tmp = `edit('${name}', '${counter}')`;
              button.setAttribute("onclick", tmp);
              button.id = counter;
              const ViewButton = document.createElement('button');
              ViewButton.append("VIEW");
              ViewButton.className = "btn-view";
              tmp = `view('${name}', '${counter}')`;
              ViewButton.setAttribute("onclick", tmp);
              ViewButton.id = counter;
              ++counter;
              const btnGroup = document.createElement('div');
              btnGroup.className = 'btn-group'; 
              btnGroup.appendChild(button);
              btnGroup.appendChild(ViewButton);
              td.appendChild(btnGroup);
              row.appendChild(td);
          }
          table.appendChild(row);
      });
    }).catch(error => console.error('Error fetching:'.concat(name), error));
}

async function createAddForm(name) {
  const div = document.getElementById("addTable");
  div.className = "overlay-container";
  const box = document.createElement("div");
  box.className = "popup-box";
  div.appendChild(box);
  const title = document.createElement("h2");
  title.innerHTML = "Update";
  box.appendChild(title);
  const form = document.createElement("form");
  form.className = "form-container";
  const submitButton = document.createElement("button");
  submitButton.className = "btn-submit";
  submitButton.setAttribute("onclick", "update('".concat(name).concat("')"));
  submitButton.type = "submit";
  submitButton.innerHTML = "Update";

  const fields = document.getElementById(name.concat("-fields")).children;
  for (let item of fields) {
    const label = document.createElement("label");
    label.className = "form-label"
    label.setAttribute("for", item.innerHTML);
    label.innerHTML  = item.innerHTML;
    const input = document.createElement("input");
    input.className = "form-input";
    input.type = "text";
    input.id = item.innerHTML;
    input.name = item.innerHTML;
    form.appendChild(label);
    form.appendChild(input);
  }

  const closeButton = document.createElement("button");
  closeButton.className = "btn-close-popup";
  closeButton.setAttribute("onclick","toggleAddTable()");
  closeButton.innerHTML = "Close";
  form.appendChild(submitButton);
  box.appendChild(form);
  box.appendChild(closeButton);
}

async function createViewTable(name) {
  const div = document.getElementById("view");
  div.className = "overlay-container";
  const box = document.createElement("div");
  box.className = "popup-box";
  div.appendChild(box);
  const title = document.createElement("h2");
  title.innerHTML = "View";
  box.appendChild(title);
  const table = document.createElement("table");
  table.id = "viewTable";

  const closeButton = document.createElement("button");
  closeButton.className = "btn-close-popup";
  closeButton.setAttribute("onclick","toggleView()");
  closeButton.innerHTML = "Close";
  box.appendChild(table);
  box.appendChild(closeButton);
}


function toggleID(ID) {
    const overlay = document.getElementById(ID);
    overlay.classList.toggle('show');
}

function toggleAddTable() {
    toggleID('addTable');
}

function toggleView() {
    toggleID('view');
}

function getTableRows(name, idx) {
  const row = document.getElementById(`${name}-table`).rows[Number(idx)+1].cells;
  return row;
}

function getIDIdx(name) {
  const fields = document.getElementById(name.concat("-fields")).children;
  let idx = 0;
  for (let item of fields) {
    const val = item.innerHTML.toLowerCase();
    if (val.includes("id") && val.includes(name)) return idx;
    ++idx;
  }
}

function getIDKey(name) {
  const fields = document.getElementById(name.concat("-fields")).children;
  const idx = getIDIdx(name);
  return fields.item(idx).innerHTML;
}

function getIDVal(name, idx) {
  const i = getIDIdx(name);
  console.log(getTableRows(name, idx));
  return getTableRows(name, Number(idx))[i].innerHTML;
}

async function update(name) {
  let formData = new FormData();
  const fields = document.getElementById(name.concat("-fields")).children;
  const idKey = getIDKey(name);
  for (let item of fields) {
    formData.append(item.innerHTML, document.getElementById(item.innerHTML).value);
  }
  const link = 'http://127.0.0.1:5000/'.concat(name).concat('/').concat(formData.get(idKey));
  return fetch(link, {
    mode:"no-cors",
    method: "POST",
    body: formData
  }).then((response) => console.log(response.json()));
}


async function view(name, idx) {
  const idKey = getIDKey(name);
  const idVal = getIDVal(name, idx);
  const link = 'http://127.0.0.1:5000/'.concat(name).concat('/').concat(idVal);
  fetch(link, {
    method: "GET",
  }).then((response) => response.json())
    .then(data => {
      const table = document.getElementById('viewTable');
      table.innerHTML = '';
      const headerRow = document.createElement('tr');
      Object.keys(data[0]).forEach(key => {
          const th = document.createElement('th');
          th.appendChild(document.createTextNode(key));
          headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
      data.forEach(item => {
          const row = document.createElement('tr');
          Object.values(item).forEach(value => {
              const td = document.createElement('td');
              td.appendChild(document.createTextNode(value));
              row.appendChild(td);
          });
          table.appendChild(row);
      });

      toggleView();
  }).catch(error => console.error('Error fetching:'.concat(name), error));
}

function edit(name, idx) {
  const fields = document.getElementById(name.concat("-fields")).children;
  const row = getTableRows(name, idx);
  let i = 0;
  for (let item of fields) {
    document.getElementById(item.innerHTML).value = row[i++].innerHTML;
  }
  toggleAddTable();
}

function add(name) {
  const fields = document.getElementById(name.concat("-fields")).children;
  for (let item of fields) {
    document.getElementById(item.innerHTML).value = "";
  }
  toggleAddTable();
}


function goAccount() {
  window.location.href = './account.html';
}

function goTransaction() {
  window.location.href = './transaction.html';
}